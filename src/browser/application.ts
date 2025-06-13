import { GameInfo, GameLaunchEvent } from '@overwolf/ow-electron-packages-types';
import { MainWindowController } from './controllers/main-window.controller';
import { OverlayService } from './services/overlay.service';
import { kGameIds } from "@overwolf/ow-electron-packages-types/game-list";
import { kGepSupportedGameIds } from '@overwolf/ow-electron-packages-types/gep-supported-games';
import { GameEventsService } from './services/gep.service';

export class Application {
  /**
   *
   */
  constructor(
    private readonly overlayService: OverlayService,
    private readonly gepService: GameEventsService,
    private readonly mainWindowController: MainWindowController) {

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

    // for gep supported games goto:
    // https://overwolf.github.io/api/electron/game-events/
    gepService.registerGames([
      kGepSupportedGameIds.TeamfightTactics,
      //kGepSupportedGameIds.DiabloIV,
      //kGepSupportedGameIds.RocketLeague,
    ]);
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
   *
   */
  private onOverlayServiceReady() {
    // Which games to support overlay for
    this.overlayService.registerToGames([
      kGameIds.LeagueofLegends,
      kGameIds.TeamfightTactics,
      kGameIds.RocketLeague,
      kGameIds.DiabloIV
    ]);
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
          this.mainWindowController.printLogMessage('Game injected, creating widget:', gameInfo.name);

          // Automatically create widget when game is injected
          this.createGameWidget();
        });

        // Listen for game exit to clean up
        this.overlayService.overlayApi.on('game-exit', (gameInfo: GameInfo) => {
          this.mainWindowController.printLogMessage('Game exited:', gameInfo.name);
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
