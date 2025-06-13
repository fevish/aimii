import { GameInfo, GameLaunchEvent } from '@overwolf/ow-electron-packages-types';
import { MainWindowController } from './controllers/main-window.controller';
import { OverlayService } from './services/overlay.service';
import { GameEventsService } from './services/gep.service';
import { GamesService } from './services/games.service';

export class Application {
  /**
   *
   */
  constructor(
    private readonly overlayService: OverlayService,
    private readonly gepService: GameEventsService,
    private readonly mainWindowController: MainWindowController,
    private readonly gamesService: GamesService) {

    overlayService.on('ready', this.onOverlayServiceReady.bind(this));

    overlayService.on('injection-decision-handling', (
      event: GameLaunchEvent,
      gameInfo: GameInfo
    ) => {
      // Always inject because we tell it which games we want in
      // onOverlayServiceReady
      event.inject();
    });

    // Listen for game injection to create widget
    this.setupGameInjectionHandling();

    // Register games for GEP (Game Events Provider) using games.json
    this.registerGepGames();
  }

  /**
   *
   */
  public run() {
    this.initialize();
  }

  /**
   *
   */
  private initialize() {
    const showDevTools = true;
    this.mainWindowController.createAndShow(showDevTools);
  }

  /**
   * Register games for GEP (Game Events Provider) based on games.json
   */
  private registerGepGames() {
    const gepGameIds = this.gamesService.getEnabledGameIds();

    this.mainWindowController.printLogMessage(`Registering games for GEP: ${this.gamesService.getGameSummary()}`);
    this.gepService.registerGames(gepGameIds);
  }

  /**
   * Register games for overlay injection based on games.json
   */
  private onOverlayServiceReady() {
    const overlayGameIds = this.gamesService.getEnabledGameIds();

    this.mainWindowController.printLogMessage(`Registering games for overlay: ${this.gamesService.getGameSummary()}`);
    this.overlayService.registerToGames(overlayGameIds);
  }

  /**
   * Setup handling for when games are injected
   */
  private setupGameInjectionHandling() {
    // Listen for when overlay is ready to register for game events
    this.overlayService.on('ready', () => {
      if (this.overlayService.overlayApi) {
        // Listen for game injection events
        this.overlayService.overlayApi.on('game-injected', (gameInfo: GameInfo) => {
          const gameData = this.gamesService.getGameByOwId(gameInfo.id?.toString() || '');
          const gameName = gameData?.game || gameInfo.name || 'Unknown Game';

          this.mainWindowController.printLogMessage('Game injected, creating widget:', gameName);

          // Automatically create widget when game is injected
          this.createGameWidget();
        });

        // Listen for game exit to clean up
        this.overlayService.overlayApi.on('game-exit', (gameInfo: GameInfo) => {
          const gameData = this.gamesService.getGameByOwId(gameInfo.id?.toString() || '');
          const gameName = gameData?.game || gameInfo.name || 'Unknown Game';

          this.mainWindowController.printLogMessage('Game exited:', gameName);
        });
      }
    });
  }

  /**
   * Create the in-game widget
   */
  private async createGameWidget() {
    try {
      this.mainWindowController.printLogMessage('Creating AIMII widget...');
      await this.mainWindowController.createWidgetWindow();
      this.mainWindowController.printLogMessage('AIMII widget created successfully!');
    } catch (error) {
      this.mainWindowController.printLogMessage('Error creating widget:', error);
    }
  }
}
