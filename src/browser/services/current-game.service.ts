import { OverlayService } from "./overlay.service";
import { GamesService } from "./games.service";
import EventEmitter from 'events';

export interface CurrentGameInfo {
  id: number;
  name: string;
  owGameName: string;
  isSupported: boolean;
  gameData: any;
}

export class CurrentGameService extends EventEmitter {
  private currentGameInfo: CurrentGameInfo | null = null;

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
      console.log('Game injected event received:', gameInfo);
      this.updateCurrentGame();
    });

    // Listen for game launch events
    this.overlayService.overlayApi.on('game-launched', (event, gameInfo) => {
      console.log('Game launched event received:', gameInfo);
      // Auto-inject for supported games
      if (this.gamesService.getGameByOwId(gameInfo.classId?.toString())) {
        event.inject();
      }
      this.updateCurrentGame();
    });

    // Listen for game focus changes (might indicate game switch)
    this.overlayService.overlayApi.on('game-focus-changed', (window, game, focus) => {
      if (focus) {
        console.log('Game focus changed:', game);
        this.updateCurrentGame();
      }
    });
  }

  private updateCurrentGame(): void {
    const newGameInfo = this.getCurrentGameInfo();

    // Check if the game has actually changed
    const hasChanged = !this.currentGameInfo ||
      !newGameInfo ||
      this.currentGameInfo.id !== newGameInfo.id ||
      this.currentGameInfo.name !== newGameInfo.name ||
      this.currentGameInfo.isSupported !== newGameInfo.isSupported;

    if (hasChanged) {
      this.currentGameInfo = newGameInfo;
      console.log('Current game changed:', newGameInfo);
      this.emit('game-changed', newGameInfo);
    }
  }

  public getCurrentGameInfo(): CurrentGameInfo | null {
    const activeGame = this.overlayService.overlayApi?.getActiveGameInfo();
    if (!activeGame) {
      return null;
    }

    const overwolfGameId = activeGame.gameInfo.classId?.toString() || '';
    const overwolfGameName = activeGame.gameInfo.name || 'Unknown Game';
    // const owGameData = activeGame.gameInfo;
    // console.log('Overwolf Game Data:', owGameData);

    // Try to get game data from our games.json
    const gameData = this.gamesService.getGameByOwId(overwolfGameId);

    console.log('Found game data:', gameData ? gameData.game : 'NOT FOUND');

    if (!gameData) {
      // Let's also check all available games to see what IDs we have
      const allGames = this.gamesService.getAllGames();
      console.log('Available games in games.json:');
      allGames.forEach(game => {
        console.log(`- ${game.game}: owGameId="${game.owGameId}"`);
      });
    }

    console.log('===============================');

    return {
      id: activeGame.gameInfo.classId,
      name: gameData?.game || overwolfGameName,
      owGameName: gameData?.owGameName || overwolfGameName,
      isSupported: !!gameData,
      gameData: gameData || null
    };
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
}