import { GameInfo, GameLaunchEvent } from '@overwolf/ow-electron-packages-types';
import { app as ElectronApp } from 'electron';
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
    private readonly gamesService: GamesService
  ) {

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

    // Register games for GEP when GEP service is ready
    gepService.on('ready', this.registerGepGames.bind(this));

  }

  /**
   *
   */
  public run() {
    // Check if another instance is already running
    const gotTheLock = ElectronApp.requestSingleInstanceLock();

    if (!gotTheLock) {
      console.log('Another instance of aimii is already running. Exiting...');
      ElectronApp.quit();
      return;
    }

    // Handle second instance attempts
    ElectronApp.on('second-instance', (event: Electron.Event, commandLine: string[], workingDirectory: string) => {
      console.log('Second instance attempted, focusing existing window');

      // Focus the existing window
      const mainWindow = this.mainWindowController.getBrowserWindow();
      if (mainWindow) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }

        mainWindow.focus();
      }
    });

    this.initialize();
  }

  /**
   *
   */
  private initialize() {
    this.mainWindowController.createAndShow();
  }

  /**
   * Register games for GEP (Game Events Provider) based on games.json
   */
  private async registerGepGames() {
    const gepGameIds = this.gamesService.getEnabledGameIds();

    this.mainWindowController.printLogMessage(`Registering games for GEP: ${this.gamesService.getGameSummary()}`);
    await this.gepService.registerGames(gepGameIds);
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
          const owId = gameInfo.classId ?? gameInfo.id; // Fallback to id if classId missing
          const gameData = this.gamesService.getGameByOwId(owId?.toString() || '');
          const gameName = gameData?.game || gameInfo.name || 'Unknown Game';

          this.mainWindowController.printLogMessage('Game injected, creating widget:', gameName);

          // Automatically create widget when game is injected
          this.createGameWidget();
        });

        // Listen for game exit to clean up
        this.overlayService.overlayApi.on('game-exit', (gameInfo: GameInfo) => {
          const owId = gameInfo.classId ?? gameInfo.id;
          const gameData = this.gamesService.getGameByOwId(owId?.toString() || '');
          const gameName = gameData?.game || gameInfo.name || 'Unknown Game';

          this.mainWindowController.printLogMessage('Game exited:', gameName);

          const exitedId = String(owId ?? '');
          const nextGame = this.overlayService.overlayApi?.getActiveGameInfo();
          const nextId = String((nextGame as any)?.gameInfo?.classId ?? '');
          const anotherGameRunning = exitedId && nextGame?.gameInfo && nextId && nextId !== exitedId;
          if (!anotherGameRunning) {
            this.mainWindowController.destroyWidgetWindow();
            this.mainWindowController.restoreWindowAfterGameExit();
          }
        });
      }
    });
  }

  /**
   * Create the in-game widget
   */
  private async createGameWidget() {
    try {
      this.mainWindowController.printLogMessage('Creating aimii widget...');
      await this.mainWindowController.createWidgetWindow();
      this.mainWindowController.printLogMessage('aimii widget created successfully!');

      // Move main window to second screen if user has multiple displays
      this.mainWindowController.moveToSecondScreenWhenGameLaunches();
    } catch (error) {
      this.mainWindowController.printLogMessage('Error creating widget:', error);
    }
  }

}
