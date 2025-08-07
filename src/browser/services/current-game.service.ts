import { OverlayService } from './overlay.service';
import { GamesService } from './games.service';
import { CustomGameDetectorService } from './custom-game-detector.service';
import EventEmitter from 'events';

/**
 * Represents information about a currently detected game
 */
export interface CurrentGameInfo {
  id: number;
  name: string;
  owGameName?: string;
  isSupported: boolean;
  gameData: any;
  detectionSource: 'gep' | 'overlay' | 'custom';
}

/**
 * Configuration for the CurrentGameService
 */
interface CurrentGameServiceConfig {
  readonly UPDATE_DEBOUNCE_MS: number;
  readonly PERIODIC_CHECK_MS: number;
}

/**
 * Central service for managing game detection across multiple sources.
 *
 * This service coordinates detection from:
 * - GEP (Game Events Package) - Primary detection for supported games
 * - Overlay API - Secondary detection for overlay-enabled games
 * - Custom Detector - Fallback detection for unsupported games
 *
 * Features:
 * - Multi-source game detection with deduplication
 * - Event-driven updates with debouncing
 * - Periodic verification of running games
 * - Automatic cleanup of stale game states
 */
export class CurrentGameService extends EventEmitter {
  // Configuration
  private readonly config: CurrentGameServiceConfig = {
    UPDATE_DEBOUNCE_MS: 200,
    PERIODIC_CHECK_MS: 2000
  };

  // State management
  private currentGameInfo: CurrentGameInfo | null = null;
  private allDetectedGames: CurrentGameInfo[] = [];
  private previousState: {
    gameInfo: CurrentGameInfo | null;
    detectedGamesCount: number;
  } = { gameInfo: null, detectedGamesCount: 0 };

  // Dependencies (injected)
  private gepService: any = null;
  private customGameDetectorService: CustomGameDetectorService | null = null;

  // Timers and cleanup
  private updateTimeout: NodeJS.Timeout | null = null;
  private periodicCheckInterval: NodeJS.Timeout | null = null;
  private lastUpdateTime: number = 0;

  constructor(
    private readonly overlayService: OverlayService,
    private readonly gamesService: GamesService
  ) {
    super();
    this.setupEventListeners();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Get the currently selected game information
   */
  public getCurrentGameInfo(): CurrentGameInfo | null {
    this.updateGameState();
    return this.currentGameInfo;
  }

  /**
   * Get all currently detected games from all sources
   */
  public getAllDetectedGames(): CurrentGameInfo[] {
    this.updateGameState();
    return this.allDetectedGames;
  }

  /**
   * Set the current game by ID
   */
  public setCurrentGame(gameId: number): void {
    const game = this.allDetectedGames.find(g => g.id === gameId);
    if (game) {
      this.currentGameInfo = game;
      this.emit('game-changed', game);
    }
  }

  /**
   * Check if any game is currently running
   */
  public isGameRunning(): boolean {
    return this.getCurrentGameInfo() !== null;
  }

  /**
   * Get the name of the current game
   */
  public getCurrentGameName(): string | null {
    const gameInfo = this.getCurrentGameInfo();
    return gameInfo ? gameInfo.name : null;
  }

  /**
   * Check if the current game is supported
   */
  public isCurrentGameSupported(): boolean {
    const gameInfo = this.getCurrentGameInfo();
    return gameInfo ? gameInfo.isSupported : false;
  }

  /**
   * Manually trigger a game state update
   */
  public refreshCurrentGame(): void {
    this.updateGameState();
  }

  /**
   * Inject the GEP service for game detection
   */
  public setGepService(gepService: any): void {
    this.gepService = gepService;
    this.setupGepEventListeners(gepService);
  }

  /**
   * Inject the custom game detector service
   */
  public setCustomGameDetectorService(customGameDetectorService: CustomGameDetectorService): void {
    this.customGameDetectorService = customGameDetectorService;
    this.setupCustomDetectorEventListeners(customGameDetectorService);
  }

  /**
   * Cleanup resources and prevent memory leaks
   */
  public cleanup(): void {
    this.clearTimers();
  }

  // ============================================================================
  // PRIVATE METHODS - Event Setup
  // ============================================================================

  private setupEventListeners(): void {
    this.setupOverlayEventListeners();
  }

  private setupOverlayEventListeners(): void {
    this.overlayService.on('ready', () => {
      this.registerOverlayGameEvents();
      this.scheduleUpdate();
    });

    if (this.overlayService.overlayApi) {
      this.registerOverlayGameEvents();
      this.scheduleUpdate();
    }
  }

  private registerOverlayGameEvents(): void {
    if (!this.overlayService.overlayApi) return;

    this.overlayService.overlayApi.on('game-injected', () => {
      this.scheduleUpdate();
    });

    this.overlayService.overlayApi.on('game-launched', (event, gameInfo) => {
      const normalizedGameId = this.normalizeGameId(gameInfo.classId || '');
      if (this.gamesService.getGameByOwId(normalizedGameId)) {
        event.inject();
      }

      this.scheduleUpdate();
    });

    this.overlayService.overlayApi.on('game-focus-changed', (window, game, focus) => {
      if (focus) {
        this.scheduleUpdate();
      }
    });
  }

  private setupGepEventListeners(gepService: any): void {
    if (!gepService) return;

    gepService.on('game-detected', () => {
      this.scheduleUpdate();
    });

    gepService.on('game-exit', () => {
      this.scheduleUpdate();
    });

    gepService.on('ready', () => {
      setTimeout(() => {
        this.scheduleUpdate();
        this.startPeriodicCheck();
      }, 1000);
    });
  }

  private setupCustomDetectorEventListeners(customGameDetectorService: CustomGameDetectorService): void {
    if (!customGameDetectorService) return;

    customGameDetectorService.on('games-detected', () => {
      this.scheduleUpdate();
    });
  }

  // ============================================================================
  // PRIVATE METHODS - Update Management
  // ============================================================================

  private scheduleUpdate(): void {
    this.clearUpdateTimeout();
    this.updateTimeout = setTimeout(() => {
      this.updateGameState();
    }, this.config.UPDATE_DEBOUNCE_MS);
  }

  private updateGameState(): void {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.config.UPDATE_DEBOUNCE_MS) {
      return;
    }

    this.updateAllDetectedGames();
    this.checkForStateChanges();
    this.lastUpdateTime = now;
  }

  private checkForStateChanges(): void {
    const newGameInfo = this.currentGameInfo;
    const newDetectedGamesCount = this.allDetectedGames.length;

    const currentGameChanged = this.hasCurrentGameChanged(newGameInfo);
    const detectedGamesCountChanged = this.previousState.detectedGamesCount !== newDetectedGamesCount;

    if (currentGameChanged || detectedGamesCountChanged) {
      this.previousState = {
        gameInfo: newGameInfo,
        detectedGamesCount: newDetectedGamesCount
      };
      this.emit('game-changed', newGameInfo);
    }
  }

  private hasCurrentGameChanged(newGameInfo: CurrentGameInfo | null): boolean {
    const previous = this.previousState.gameInfo;

    if (!previous && !newGameInfo) return false;
    if (!previous || !newGameInfo) return true;

    return previous.id !== newGameInfo.id ||
           previous.name !== newGameInfo.name ||
           previous.isSupported !== newGameInfo.isSupported;
  }

  // ============================================================================
  // PRIVATE METHODS - Game Detection
  // ============================================================================

  private updateAllDetectedGames(): void {
    const detectedGames: CurrentGameInfo[] = [];

    // Collect games from all detection sources
    detectedGames.push(...this.getGepGames());
    detectedGames.push(...this.getOverlayGames());
    detectedGames.push(...this.getCustomDetectedGames());

    // Remove duplicates and update state
    this.allDetectedGames = this.deduplicateGames(detectedGames);
    this.updateCurrentGameSelection();
  }

  private deduplicateGames(games: CurrentGameInfo[]): CurrentGameInfo[] {
    const uniqueGames: CurrentGameInfo[] = [];
    const seenIds = new Set<number>();

    for (const game of games) {
      if (!seenIds.has(game.id)) {
        seenIds.add(game.id);
        uniqueGames.push(game);
      }
    }

    return uniqueGames;
  }

  private updateCurrentGameSelection(): void {
    if (!this.currentGameInfo || !this.allDetectedGames.find(g => g.id === this.currentGameInfo?.id)) {
      this.currentGameInfo = this.allDetectedGames[0] || null;
    }
  }

  // ============================================================================
  // PRIVATE METHODS - Detection Sources
  // ============================================================================

  private getGepGames(): CurrentGameInfo[] {
    if (!this.gepService) return [];

    const games: CurrentGameInfo[] = [];

    for (const gameId of this.gepService.activeGames) {
      const gameData = this.gamesService.getGameByOwId(this.normalizeGameId(gameId));
      if (gameData) {
        games.push({
          id: gameId,
          name: gameData.game,
          owGameName: gameData.owGameName,
          isSupported: true,
          gameData,
          detectionSource: 'gep'
        });
      }
    }

    return games;
  }

  private getOverlayGames(): CurrentGameInfo[] {
    const activeGame = this.overlayService.overlayApi?.getActiveGameInfo();
    if (!activeGame) return [];

    const overwolfGameId = this.normalizeGameId(activeGame.gameInfo.classId || '');
    const gameData = this.gamesService.getGameByOwId(overwolfGameId);

    return [{
      id: activeGame.gameInfo.classId,
      name: gameData?.game || activeGame.gameInfo.name || 'Unknown Game',
      owGameName: gameData?.owGameName,
      isSupported: !!gameData,
      gameData: gameData || null,
      detectionSource: 'overlay'
    }];
  }

  private getCustomDetectedGames(): CurrentGameInfo[] {
    if (!this.customGameDetectorService) return [];

    const detectedGames = this.customGameDetectorService.getLastDetectedGames();
    const customGames: CurrentGameInfo[] = [];

    for (const detectedGame of detectedGames) {
      const gameData = this.gamesService
        .getAllGames()
        .find(game => (
          game.processName &&
          game.processName.toLowerCase() === detectedGame.processName.toLowerCase()
        ));

      if (gameData) {
        customGames.push({
          id: parseInt(detectedGame.pid),
          name: gameData.game,
          owGameName: gameData.owGameName,
          isSupported: gameData.enable_for_app,
          gameData,
          detectionSource: 'custom'
        });
      }
    }

    return customGames;
  }

  // ============================================================================
  // PRIVATE METHODS - Periodic Verification
  // ============================================================================

  private startPeriodicCheck(): void {
    this.clearPeriodicCheckInterval();

    this.periodicCheckInterval = setInterval(() => {
      this.performPeriodicVerification();
    }, this.config.PERIODIC_CHECK_MS);
  }

  private async performPeriodicVerification(): Promise<void> {
    const verificationPromises: Promise<void>[] = [];

    if (this.customGameDetectorService) {
      verificationPromises.push(this.customGameDetectorService.verifyRunningGames());
    }

    verificationPromises.push(this.verifyGepActiveGames());

    await Promise.all(verificationPromises);
    this.updateGameState();
  }

  private async verifyGepActiveGames(): Promise<void> {
    if (!this.gepService || !this.customGameDetectorService) return;

    const activeGamesToCheck: number[] = Array.from(this.gepService.activeGames);

    for (const gameId of activeGamesToCheck) {
      const gameData = this.gamesService.getGameByOwId(gameId.toString());
      if (gameData?.processName) {
        const isRunning = await this.customGameDetectorService.isProcessRunning(gameData.processName);
        if (!isRunning) {
          this.removeGepGame(gameId);
        }
      }
    }
  }

  private removeGepGame(gameId: number): void {
    if (!this.gepService) return;

    this.gepService.activeGames.delete(gameId);
    if (this.gepService.activeGame === gameId) {
      this.gepService.activeGame = 0;
    }
  }

  // ============================================================================
  // PRIVATE METHODS - Utilities
  // ============================================================================

  private normalizeGameId(gameId: number | string): string {
    return gameId.toString();
  }

  private clearUpdateTimeout(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
  }

  private clearPeriodicCheckInterval(): void {
    if (this.periodicCheckInterval) {
      clearInterval(this.periodicCheckInterval);
      this.periodicCheckInterval = null;
    }
  }

  private clearTimers(): void {
    this.clearUpdateTimeout();
    this.clearPeriodicCheckInterval();
  }
}
