import { OverlayService } from './overlay.service';
import { GamesService } from './games.service';
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

export class CurrentGameService extends EventEmitter {
  private currentGameInfo: CurrentGameInfo | null = null;
  private previousState: { gameInfo: CurrentGameInfo | null } = { gameInfo: null };

  constructor(
    private readonly overlayService: OverlayService,
    private readonly gamesService: GamesService
  ) {
    super();
    this.setupOverlayEventListeners();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  public getCurrentGameInfo(): CurrentGameInfo | null {
    return this.currentGameInfo;
  }

  public getAllDetectedGames(): CurrentGameInfo[] {
    return this.currentGameInfo ? [this.currentGameInfo] : [];
  }

  /** No-op: single-game model, switching is not supported */
  public setCurrentGame(_gameId: number): void {}

  public isGameRunning(): boolean {
    return this.currentGameInfo !== null;
  }

  public getCurrentGameName(): string | null {
    return this.currentGameInfo?.name ?? null;
  }

  public isCurrentGameSupported(): boolean {
    return this.currentGameInfo?.isSupported ?? false;
  }

  public refreshCurrentGame(): void {
    this.syncFromOverlay();
  }

  public setGepService(gepService: any): void {
    this.setupGepEventListeners(gepService);
  }

  public cleanup(): void {}

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  private setupOverlayEventListeners(): void {
    this.overlayService.on('ready', () => this.registerOverlayGameEvents());
    if (this.overlayService.overlayApi) {
      this.registerOverlayGameEvents();
    }
  }

  private registerOverlayGameEvents(): void {
    if (!this.overlayService.overlayApi) return;

    this.overlayService.overlayApi.on('game-injected', () => {
      this.syncFromOverlay();
    });

    this.overlayService.overlayApi.on('game-exit', (gameInfo: any) => {
      const exitedId = String(gameInfo?.classId ?? gameInfo?.id ?? '');
      const next = this.overlayService.overlayApi?.getActiveGameInfo();
      const nextId = String((next as any)?.gameInfo?.classId ?? '');
      if (next?.gameInfo && nextId && nextId !== exitedId) {
        this.syncFromOverlay();
      } else {
        this.updateCurrentGame(null);
      }
    });
  }

  private setupGepEventListeners(gepService: any): void {
    if (!gepService) return;

    gepService.on('game-detected', () => {
      this.syncFromOverlay();
    });

    gepService.on('game-exit', (gameId: number) => {
      const next = this.overlayService.overlayApi?.getActiveGameInfo();
      const nextId = String((next as any)?.gameInfo?.classId ?? '');
      if (next?.gameInfo && nextId && nextId !== String(gameId)) {
        this.syncFromOverlay();
      } else {
        this.updateCurrentGame(null);
      }
    });

    gepService.on('ready', async () => {
      try {
        await gepService.setRequiredFeaturesForAllSupportedGames?.();
        await gepService.checkForAlreadyRunningGames?.();
      } catch (_) {
        // ignore
      }
      this.syncFromOverlay();
    });
  }

  private syncFromOverlay(): void {
    const active = this.overlayService.overlayApi?.getActiveGameInfo();
    if (!active?.gameInfo) return;

    const classId = String((active as any).gameInfo.classId ?? '');
    const gameData = this.gamesService.getGameByOwId(classId);

    this.updateCurrentGame({
      id: parseInt(classId) || 0,
      name: gameData?.game || (active as any).gameInfo.name || 'Unknown Game',
      owGameName: gameData?.owGameName,
      isSupported: !!gameData,
      gameData: gameData || null,
      detectionSource: 'overlay'
    });
  }

  private updateCurrentGame(game: CurrentGameInfo | null): void {
    const prev = this.previousState.gameInfo;
    const unchanged = prev?.id === game?.id && !!prev === !!game;
    if (unchanged) return;

    this.currentGameInfo = game;
    this.previousState = { gameInfo: game };
    console.log(game ? `Game detected: ${game.name}` : 'Game exited');
    this.emit('game-changed', game);
  }
}
