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

    // Coordinate GEP and overlay for faster injection
    this.setupGepOverlayCoordination();
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
    } catch (error) {
      this.mainWindowController.printLogMessage('Error creating widget:', error);
    }
  }

  /**
   * Coordinate GEP and overlay for faster injection
   */
  private setupGepOverlayCoordination() {
    // Listen for GEP game detection to trigger immediate overlay injection
    this.gepService.on('game-detected', (gameId, name, gameInfo) => {
      this.mainWindowController.printLogMessage(`GEP detected game: ${name} (${gameId})`);

      // If overlay is ready, try to inject immediately
      if (this.overlayService.overlayApi) {
        this.mainWindowController.printLogMessage('Triggering immediate overlay injection for GEP-detected game');

        // Try to get the game info from overlay API to trigger injection
        const activeGame = this.overlayService.overlayApi.getActiveGameInfo();
        if (activeGame && activeGame.gameInfo.classId === gameId) {
          this.mainWindowController.printLogMessage('Game already detected by overlay, creating widget');
          this.createGameWidget();
        } else {
          this.mainWindowController.printLogMessage('Waiting for overlay to detect game...');
        }
      } else {
        this.mainWindowController.printLogMessage('Overlay not ready yet, will inject when available');
      }
    });

    // Listen for GEP game exit to clean up
    this.gepService.on('game-exit', (gameId, processName, pid) => {
      this.mainWindowController.printLogMessage(`GEP detected game exit: ${processName} (${gameId})`);
    });
  }
}
