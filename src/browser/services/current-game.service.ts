import { OverlayService } from "./overlay.service";
import { GamesService } from "./games.service";
import EventEmitter from 'events';

export interface CurrentGameInfo {
  id: number;
  name: string;
  owGameName?: string;
  isSupported: boolean;
  gameData: any;
}

export class CurrentGameService extends EventEmitter {
  private currentGameInfo: CurrentGameInfo | null = null;
  private gepService: any = null; // We'll inject this later
  private updateTimeout: NodeJS.Timeout | null = null;
  private lastUpdateTime: number = 0;
  private readonly UPDATE_DEBOUNCE_MS = 500; // Debounce updates to 500ms

  constructor(
    private readonly overlayService: OverlayService,
    private readonly gamesService: GamesService
  ) {
    super();
    this.setupGameEventListeners();
  }

  private setupGameEventListeners(): void {
    // Listen for overlay service to be ready
    this.overlayService.on('ready', () => {
      this.registerOverlayGameEvents();
    });

    // If overlay is already ready, register immediately
    if (this.overlayService.overlayApi) {
      this.registerOverlayGameEvents();
    }
  }

  private registerOverlayGameEvents(): void {
    if (!this.overlayService.overlayApi) return;

    // Listen for game injection (when overlay connects to a game)
    this.overlayService.overlayApi.on('game-injected', (gameInfo) => {
      this.scheduleUpdate();
    });

    // Listen for game launch events
    this.overlayService.overlayApi.on('game-launched', (event, gameInfo) => {
      // Auto-inject for supported games using normalized game ID
      const normalizedGameId = this.normalizeGameId(gameInfo.classId || '');
      if (this.gamesService.getGameByOwId(normalizedGameId)) {
        event.inject();
      }
      this.scheduleUpdate();
    });

    // Listen for game focus changes (might indicate game switch)
    this.overlayService.overlayApi.on('game-focus-changed', (window, game, focus) => {
      if (focus) {
        this.scheduleUpdate();
      }
    });
  }

  private scheduleUpdate(): void {
    // Clear existing timeout
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    // Debounce updates to prevent excessive calls
    this.updateTimeout = setTimeout(() => {
      this.updateCurrentGame();
    }, this.UPDATE_DEBOUNCE_MS);
  }

  private updateCurrentGame(): void {
    const now = Date.now();
    if (now - this.lastUpdateTime < this.UPDATE_DEBOUNCE_MS) {
      return; // Skip if too soon since last update
    }

    const newGameInfo = this.getCurrentGameInfo();

    // Check if the game has actually changed
    const hasChanged = !this.currentGameInfo ||
      !newGameInfo ||
      this.currentGameInfo.id !== newGameInfo.id ||
      this.currentGameInfo.name !== newGameInfo.name ||
      this.currentGameInfo.isSupported !== newGameInfo.isSupported;

    if (hasChanged) {
      this.currentGameInfo = newGameInfo;
      this.lastUpdateTime = now;
      console.log('Current game changed:', newGameInfo);
      this.emit('game-changed', newGameInfo);
    }
  }

  public getCurrentGameInfo(): CurrentGameInfo | null {
    // Prioritize GEP detection for faster response
    const gepGameInfo = this.getCurrentGameInfoFromGep();
    if (gepGameInfo) {
      return gepGameInfo;
    }

    // Fallback to overlay detection
    const activeGame = this.overlayService.overlayApi?.getActiveGameInfo();
    if (!activeGame) {
      return null;
    }

    const overwolfGameId = this.normalizeGameId(activeGame.gameInfo.classId || '');
    const overwolfGameName = activeGame.gameInfo.name || 'Unknown Game';

    // Try to get game data from our games.json
    const gameData = this.gamesService.getGameByOwId(overwolfGameId);

    return {
      id: activeGame.gameInfo.classId,
      name: gameData?.game || overwolfGameName,
      owGameName: gameData?.owGameName,
      isSupported: !!gameData,
      gameData: gameData || null
    };
  }

  private getCurrentGameInfoFromGep(): CurrentGameInfo | null {
    if (!this.gepService) {
      return null;
    }

    // Check if GEP has an active game
    if (this.gepService.activeGame === 0) {
      return null;
    }

    // Use the active game ID from GEP - normalize to Overwolf's official format
    const normalizedGameId = this.normalizeGameId(this.gepService.activeGame);
    const gameData = this.gamesService.getGameByOwId(normalizedGameId);

    if (gameData) {
      return {
        id: this.gepService.activeGame, // Keep as number for compatibility
        name: gameData.game,
        owGameName: gameData.owGameName,
        isSupported: true,
        gameData: gameData
      };
    }

    return null;
  }

  public isGameRunning(): boolean {
    return this.getCurrentGameInfo() !== null;
  }

  public getCurrentGameName(): string | null {
    const gameInfo = this.getCurrentGameInfo();
    return gameInfo ? gameInfo.name : null;
  }

  public isCurrentGameSupported(): boolean {
    const gameInfo = this.getCurrentGameInfo();
    return gameInfo ? gameInfo.isSupported : false;
  }

  // Method to manually trigger an update (for initial load)
  public refreshCurrentGame(): void {
    this.updateCurrentGame();
  }

  // Method to inject GEP service for fallback detection
  public setGepService(gepService: any): void {
    this.gepService = gepService;

    // Listen for GEP game detection events
    if (gepService) {
      gepService.on('game-detected', () => {
        this.scheduleUpdate();
      });

      // Listen for GEP game exit events for faster cleanup
      gepService.on('game-exit', () => {
        this.scheduleUpdate();
      });
    }
  }

  /**
   * Centralized method to normalize game IDs to Overwolf's official format
   * Ensures consistency across GEP, Overlay, and games.json
   */
  private normalizeGameId(gameId: number | string): string {
    // Convert to string and ensure it matches Overwolf's format
    return gameId.toString();
  }

  /**
   * Cleanup method to clear timeouts and prevent memory leaks
   */
  public cleanup(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
  }
}