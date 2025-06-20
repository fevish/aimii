import { app as electronApp, ipcMain, BrowserWindow, Menu } from 'electron';
import { GameEventsService } from '../services/gep.service';
import path from 'path';
import { DemoOSRWindowController } from './demo-osr-window.controller';
import { WidgetWindowController } from './widget-window.controller';
import { OverlayService } from '../services/overlay.service';
import { overwolf } from '@overwolf/ow-electron';
import { OverlayHotkeysService } from '../services/overlay-hotkeys.service';
import { ExclusiveHotKeyMode, OverlayInputService } from '../services/overlay-input.service';
import { setMainWindowForConsole } from '../index';
import { GamesService } from '../services/games.service';
import { SettingsService } from '../services/settings.service';
import { CurrentGameService } from '../services/current-game.service';
import { SensitivityConverterService } from '../services/sensitivity-converter.service';
import { WindowStateService } from '../services/window-state.service';

const owElectronApp = electronApp as overwolf.OverwolfApp;

/**
 *
 */
export class MainWindowController {
  private browserWindow: BrowserWindow | null = null;
  private widgetController: WidgetWindowController | null = null;

  /**
   *
   */
  constructor(
    private readonly gepService: GameEventsService,
    private readonly overlayService: OverlayService,
    private readonly createDemoOsrWinController: () => DemoOSRWindowController,
    private readonly createWidgetWinController: () => WidgetWindowController,
    private readonly overlayHotkeysService: OverlayHotkeysService,
    private readonly overlayInputService: OverlayInputService,
    private readonly gamesService: GamesService,
    private readonly settingsService: SettingsService,
    private readonly currentGameService: CurrentGameService,
    private readonly sensitivityConverterService: SensitivityConverterService,
    private readonly windowStateService: WindowStateService
  ) {
    this.registerToIpc();
    this.setupGameChangeListener();

    gepService.on('log', this.printLogMessage.bind(this));
    overlayService.on('log', this.printLogMessage.bind(this));

    overlayHotkeysService.on('log', this.printLogMessage.bind(this));

    owElectronApp.overwolf.packages.on('crashed', (e: any, ...args: any[]) => {
      this.printLogMessage('package crashed', ...args);
      // ow-electron package manager crashed (will be auto relaunch)
      // e.preventDefault();
      // calling `e.preventDefault();` will stop the GEP Package from
      // automatically re-launching
    });

    owElectronApp.overwolf.packages.on(
      'failed-to-initialize',
      this.logPackageManagerErrors.bind(this)
    );
  }

  private setupGameChangeListener(): void {
    // Listen for game changes from the CurrentGameService
    this.currentGameService.on('game-changed', (gameInfo) => {
      this.printLogMessage('Current game changed:', gameInfo?.name || 'No game');

      // Notify all renderer processes about the game change
      if (this.browserWindow && !this.browserWindow.isDestroyed()) {
        this.browserWindow.webContents.send('current-game-changed', gameInfo);
      }

      // Notify widget if it exists
      if (this.widgetController?.overlayBrowserWindow) {
        this.widgetController.overlayBrowserWindow.window.webContents.send('current-game-changed', gameInfo);
      }
    });

    // Trigger initial game detection
    this.currentGameService.refreshCurrentGame();
  }

  /**
   *
   */
  public printLogMessage(message: String, ...args: any[]) {
    if (!this.browserWindow || (this.browserWindow?.isDestroyed() ?? true)) {
      return;
    }
    this.browserWindow?.webContents?.send('console-message', message, ...args);
  }

  //----------------------------------------------------------------------------
  private logPackageManagerErrors(e: any, packageName: any, ...args: any[]) {
    this.printLogMessage(
      'Overwolf Package Manager error!',
      packageName,
      ...args
    );
  }

  /**
   *
   */
  public createAndShow(showDevTools: boolean) {
    // Load saved window state
    const savedState = this.windowStateService.loadWindowState();

    this.browserWindow = new BrowserWindow({
      width: savedState.width,
      height: savedState.height,
      x: savedState.x,
      y: savedState.y,
      title: 'AIMII - Mouse Sensitivity Converter',
      show: false, // Don't show until we've set up the state
      resizable: false, // Disable window resizing
      webPreferences: {
        // NOTE: nodeIntegration and contextIsolation are only required for this
        // specific demo app, they are not a neceassry requirement for any other
        // ow-electron applications
        nodeIntegration: true,
        contextIsolation: true,
        devTools: showDevTools || savedState.devToolsOpen,
        // relative to root folder of the project
        preload: path.join(__dirname, '../preload/preload.js'),
      },
    });

    // Apply saved window state
    this.windowStateService.applyWindowState(this.browserWindow);

    // Set up automatic state saving
    this.windowStateService.setupStateSaving(this.browserWindow);

    // Hide the menu bar but keep the default menu and all default hotkeys
    this.browserWindow.setMenuBarVisibility(false);

    // Block F11 only (allow F5, Ctrl+R, DevTools hotkeys)
    this.browserWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F11') {
        event.preventDefault();
      }
    });

    // Set up console logging to Chrome dev tools
    setMainWindowForConsole(this.browserWindow);

    this.browserWindow.loadFile(path.join(__dirname, '../my-main.html'));

    // Show the window after it's loaded
    this.browserWindow.once('ready-to-show', () => {
      this.browserWindow?.show();
    });
  }

  /**
   *
   */
  private registerToIpc() {
    ipcMain.handle('createOSR', async () => await this.createOSRDemoWindow());

    ipcMain.handle('createWidget', async () => await this.createWidget());

    ipcMain.handle('toggleWidget', async () => await this.toggleWidget());

    ipcMain.handle('openWidgetDevTools', () => {
      this.openWidgetDevTools();
    });

    // Games service IPC handlers
    ipcMain.handle('games-get-all', () => {
      return this.gamesService.getAllGames();
    });

    ipcMain.handle('games-get-enabled', () => {
      return this.gamesService.getEnabledGames();
    });

    ipcMain.handle('games-get-summary', () => {
      return this.gamesService.getGameSummary();
    });

    ipcMain.handle('games-get-enabled-ids', () => {
      return this.gamesService.getEnabledGameIds();
    });

    // Canonical settings IPC handlers
    ipcMain.handle('settings-get-canonical', () => {
      return this.settingsService.getCanonicalSettings();
    });

    ipcMain.handle('settings-set-canonical', (event, game: string, sensitivity: number, dpi: number) => {
      this.settingsService.setCanonicalSettings(game, sensitivity, dpi);
      this.printLogMessage(`Canonical settings saved: ${game}, sensitivity: ${sensitivity}, DPI: ${dpi}`);
      return true;
    });

    ipcMain.handle('settings-has-canonical', () => {
      return this.settingsService.hasCanonicalSettings();
    });

    // Current game service IPC handlers
    ipcMain.handle('current-game-get-info', () => {
      return this.currentGameService.getCurrentGameInfo();
    });

    ipcMain.handle('current-game-is-running', () => {
      return this.currentGameService.isGameRunning();
    });

    ipcMain.handle('current-game-get-name', () => {
      return this.currentGameService.getCurrentGameName();
    });

    ipcMain.handle('current-game-is-supported', () => {
      return this.currentGameService.isCurrentGameSupported();
    });

    // Sensitivity converter service IPC handlers
    ipcMain.handle('sensitivity-get-suggested-for-current-game', () => {
      return this.sensitivityConverterService.getSuggestedSensitivityForCurrentGame();
    });

    ipcMain.handle('sensitivity-get-all-conversions', () => {
      return this.sensitivityConverterService.getAllConversionsFromCanonical();
    });

    ipcMain.handle('sensitivity-convert', (event, fromGame: string, toGame: string, sensitivity: number, dpi: number) => {
      const fromGameData = this.gamesService.getGameByName(fromGame);
      const toGameData = this.gamesService.getGameByName(toGame);

      if (!fromGameData || !toGameData) {
        return null;
      }

      return this.sensitivityConverterService.convertSensitivity(fromGameData, toGameData, sensitivity, dpi);
    });

    ipcMain.handle('gep-set-required-feature', async () => {
      await this.gepService.setRequiredFeaturesForAllSupportedGames();
      return true;
    });

    ipcMain.handle('gep-getInfo', async () => {
      return await this.gepService.getInfoForActiveGame();
    });

    ipcMain.handle('restart-initialization', async () => {
      this.printLogMessage('=== Re-initializing AIMII ===');

      // Get enabled games from games.json
      const gameIds = this.gamesService.getEnabledGameIds();

      this.printLogMessage(`Re-registering games: ${this.gamesService.getGameSummary()}`);

      // Re-register games for GEP
      this.gepService.registerGames(gameIds);

      // Trigger required features setup
      try {
        await this.gepService.setRequiredFeaturesForAllSupportedGames();
      } catch (error) {
        this.printLogMessage('Error setting required features:', error);
      }

      // Re-register overlay games if overlay is ready
      if (this.overlayService.overlayApi) {
        try {
          await this.overlayService.registerToGames(gameIds);
        } catch (error) {
          this.printLogMessage('Error registering overlay games:', error);
        }
      }

      this.printLogMessage('=== Re-initialization complete ===');
      return true;
    });

    ipcMain.handle('toggleOSRVisibility', async () => {
      this.overlayService?.overlayApi?.getAllWindows().forEach((e: any) => {
        e.window.show();
      })
    });

    ipcMain.handle('updateHotkey', async () => {
      this.overlayHotkeysService?.updateHotkey();
    });

    ipcMain.handle('updateExclusiveOptions', async (sender: any, options: any) => {
      this.overlayInputService?.updateExclusiveModeOptions(options);
    });

    ipcMain.handle('EXCLUSIVE_TYPE', async (sender: any, type: any) => {
      if (!this.overlayInputService) {
        return;
      }

      if (type === 'customWindow') {
        this.overlayInputService.exclusiveModeAsWindow = true;
      } else {
        // native
        this.overlayInputService.exclusiveModeAsWindow = false;
      }
    });

    ipcMain.handle('EXCLUSIVE_BEHAVIOR', async (sender: any, behavior: any) => {
      if (!this.overlayInputService) {
        return;
      }

      if (behavior === 'toggle') {
        this.overlayInputService.mode = ExclusiveHotKeyMode.Toggle;
      } else {
        // native
        this.overlayInputService.mode = ExclusiveHotKeyMode.AutoRelease;
      }
    });

    // Widget hotkey info handler
    ipcMain.handle('widget-get-hotkey-info', () => {
      return this.getWidgetHotkeyInfo();
    });
  }

  /**
   *
   */
  private async createOSRDemoWindow(): Promise<void> {
    const controller = this.createDemoOsrWinController();

    const showDevTools = true;
    await controller.createAndShow(showDevTools);

    controller.overlayBrowserWindow?.window.on('closed', () => {
      this.printLogMessage('osr window closed');
    });
  }

  /**
   * Public method to create widget (called from Application)
   */
  public async createWidgetWindow(): Promise<void> {
    await this.createWidget();
  }

  private async createWidget(): Promise<void> {
    const controller = this.createWidgetWinController();
    this.widgetController = controller; // Store reference

    await controller.createWidget();

    controller.overlayBrowserWindow?.window.on('closed', () => {
      this.printLogMessage('widget window closed');
      this.widgetController = null; // Clear reference
    });
  }

  private async toggleWidget(): Promise<void> {
    if (!this.widgetController) {
      // Create widget if it doesn't exist
      await this.createWidget();
    } else {
      this.widgetController.toggleVisibility();
    }
  }

  private openWidgetDevTools() {
    if (this.widgetController) {
      this.widgetController.openDevTools();
      this.printLogMessage('Opening widget dev tools...');
    } else {
      this.printLogMessage('Widget not created yet. Create widget first.');
    }
  }

  private getWidgetHotkeyInfo(): { keyCode: number; modifiers: { ctrl: boolean; shift: boolean; alt: boolean }; displayText: string } {
    // Widget hotkey configuration - should match the one in WidgetWindowController
    const keyCode = 77; // M key
    const modifiers = { ctrl: true, shift: true, alt: false };

    // Convert keyCode to readable key name
    const keyName = String.fromCharCode(keyCode);

    // Build display text
    const modifierParts = [];
    if (modifiers.ctrl) modifierParts.push('Ctrl');
    if (modifiers.shift) modifierParts.push('Shift');
    if (modifiers.alt) modifierParts.push('Alt');

    const displayText = `${modifierParts.join('+')}+${keyName}`;

    return {
      keyCode,
      modifiers,
      displayText
    };
  }
}
