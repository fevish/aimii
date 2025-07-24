import { app as electronApp, ipcMain, BrowserWindow, Menu, shell, nativeImage, Tray } from 'electron';
import { GameEventsService } from '../services/gep.service';
import path from 'path';

import { WidgetWindowController } from './widget-window.controller';
import { OverlayService } from '../services/overlay.service';
import { overwolf } from '@overwolf/ow-electron';
import { OverlayHotkeysService } from '../services/overlay-hotkeys.service';

import { setMainWindowForConsole } from '../index';
import { GamesService } from '../services/games.service';
import { SettingsService } from '../services/settings.service';
import { CurrentGameService } from '../services/current-game.service';
import { SensitivityConverterService } from '../services/sensitivity-converter.service';
import { WindowStateService } from '../services/window-state.service';
import { HotkeyService } from '../services/hotkey.service';

const owElectronApp = electronApp as overwolf.OverwolfApp;

/**
 *
 */
export class MainWindowController {
  private browserWindow: BrowserWindow | null = null;
  private widgetController: WidgetWindowController | null = null;
  private tray: Tray | null = null;

  /**
   *
   */
  constructor(
    private readonly gepService: GameEventsService,
    private readonly overlayService: OverlayService,
    private readonly createWidgetWinController: () => WidgetWindowController,
    private readonly overlayHotkeysService: OverlayHotkeysService,
    private readonly gamesService: GamesService,
    private readonly settingsService: SettingsService,
    private readonly currentGameService: CurrentGameService,
    private readonly sensitivityConverterService: SensitivityConverterService,
    private readonly windowStateService: WindowStateService,
    private readonly hotkeyService: HotkeyService
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
   * Load app icon with fallback paths
   */
  private loadAppIcon(): Electron.NativeImage {
    // Check if we're in development or production
    const isDev = process.resourcesPath.includes('node_modules');

    let iconPath: string;
    if (isDev) {
      // Development: load from dist (copied by webpack)
      iconPath = path.join(process.cwd(), 'dist/icon.ico');
    } else {
      // Production: load from app root
      iconPath = path.join(process.resourcesPath, '../icon.ico');
    }

    const appIcon = nativeImage.createFromPath(iconPath);
    return appIcon;
  }

  /**
   *
   */
  public createAndShow() {
    // Load saved window state
    const savedState = this.windowStateService.loadWindowState();

    // Create native image from icon file
    const appIcon = this.loadAppIcon();

    this.browserWindow = new BrowserWindow({
      width: savedState.width,
      height: savedState.height,
      x: savedState.x,
      y: savedState.y,
      frame: false, // Hide the default window frame
      title: 'aimii',
      icon: appIcon, // Use native image for better icon handling
      show: false, // Don't show until we've set up the state
      resizable: false, // Disable window resizing
      webPreferences: {
        // NOTE: nodeIntegration and contextIsolation are required for this app
        // to enable IPC communication between main and renderer processes
        nodeIntegration: true,
        contextIsolation: true,
        devTools: true,
        // relative to root folder of the project
        preload: path.join(__dirname, '../preload/preload.js'),
      },
    });

    // Create tray icon
    this.createTray(appIcon);

    // Setup window close handler for minimize-to-tray
    this.setupWindowCloseHandler();

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

    this.browserWindow.loadFile(path.join(__dirname, '..', 'my-main.html'));

    // Show the window after it's loaded
    this.browserWindow.once('ready-to-show', () => {
      this.browserWindow?.show();
    });
  }

  /**
   * Create system tray icon
   */
  private createTray(icon: Electron.NativeImage): void {
    this.tray = new Tray(icon);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show aimii',
        click: () => {
          if (this.browserWindow && !this.browserWindow.isDestroyed()) {
            this.browserWindow.show();
            this.browserWindow.focus();
            // Update tooltip back to normal
            this.tray?.setToolTip('aimii');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit aimii',
        click: () => {
          // Force quit the app
          electronApp.exit(0);
        }
      }
    ]);

    this.tray.setContextMenu(contextMenu);
    this.tray.setToolTip('aimii');

    // Show main window when tray icon is clicked
    this.tray.on('click', () => {
      if (this.browserWindow && !this.browserWindow.isDestroyed()) {
        this.browserWindow.show();
        this.browserWindow.focus();
        // Update tooltip back to normal
        this.tray?.setToolTip('aimii');
      }
    });
  }

    /**
   * Handle window close event - minimize to tray instead of closing
   */
  private setupWindowCloseHandler(): void {
    if (!this.browserWindow) return;

    this.browserWindow.on('close', (event) => {
      // Prevent the default close behavior
      event.preventDefault();

      // Hide the window instead of closing it
      this.browserWindow?.hide();

      // Update tray tooltip to indicate app is running in background
      if (this.tray) {
        this.tray.setToolTip('aimii (running in background)');
      }
    });

    // Update tray tooltip when window is focused
    this.browserWindow.on('focus', () => {
      if (this.tray) {
        this.tray.setToolTip('aimii');
      }
    });
  }

  /**
   *
   */
  private registerToIpc() {
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

      // Notify main window about settings change
      if (this.browserWindow && !this.browserWindow.isDestroyed()) {
        this.browserWindow.webContents.send('canonical-settings-changed');
      }

      // Notify widget about settings change (pass the new settings)
      if (this.widgetController?.overlayBrowserWindow) {
        this.widgetController.overlayBrowserWindow.window.webContents.send('canonical-settings-changed', { game, sensitivity, dpi });
      }

      return true;
    });

    ipcMain.handle('settings-has-canonical', () => {
      return this.settingsService.hasCanonicalSettings();
    });

    ipcMain.handle('settings-clear-canonical', () => {
      this.settingsService.clearCanonicalSettings();
      this.printLogMessage('Canonical settings cleared');

      // Notify main window about settings change
      if (this.browserWindow && !this.browserWindow.isDestroyed()) {
        this.browserWindow.webContents.send('canonical-settings-changed');
      }

      // Notify widget about settings change (pass null to indicate cleared)
      if (this.widgetController?.overlayBrowserWindow) {
        this.widgetController.overlayBrowserWindow.window.webContents.send('canonical-settings-changed', null);
      }

      return true;
    });

    // Theme settings IPC handlers
    ipcMain.handle('settings-get-theme', () => {
      return this.settingsService.getTheme();
    });

    ipcMain.handle('settings-set-theme', (event, theme: string) => {
      this.settingsService.setTheme(theme);
      this.printLogMessage(`Theme changed to: ${theme}`);

      // Notify main window about theme change
      if (this.browserWindow && !this.browserWindow.isDestroyed()) {
        this.browserWindow.webContents.send('theme-changed', theme);
      }

      // Notify widget about theme change
      if (this.widgetController?.overlayBrowserWindow) {
        this.widgetController.overlayBrowserWindow.window.webContents.send('theme-changed', theme);
      }

      return true;
    });

    // Current game service IPC handlers
    ipcMain.handle('current-game-get-info', () => {
      return this.currentGameService.getCurrentGameInfo();
    });

    ipcMain.handle('current-game-get-all-detected', () => {
      return this.currentGameService.getAllDetectedGames();
    });

    ipcMain.handle('current-game-set-current', (event, gameId: number) => {
      this.currentGameService.setCurrentGame(gameId);
      return true;
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



    // Hotkey service IPC handlers
    ipcMain.handle('hotkeys-get-all', () => {
      return this.hotkeyService.getAllHotkeys();
    });

    ipcMain.handle('hotkeys-update', (event, id: string, updates: any) => {
      const result = this.hotkeyService.updateHotkey(id, updates);

      // Notify main window about hotkey changes
      if (this.browserWindow && !this.browserWindow.isDestroyed()) {
        this.browserWindow.webContents.send('hotkey-changed', id, updates);
      }

      return result;
    });

    ipcMain.handle('hotkeys-reset', () => {
      this.hotkeyService.resetToDefaults();

      // Notify main window about hotkey reset
      if (this.browserWindow && !this.browserWindow.isDestroyed()) {
        this.browserWindow.webContents.send('hotkeys-reset');
      }

      return true;
    });

    ipcMain.handle('hotkeys-get-info', (event, id: string) => {
      return this.hotkeyService.getHotkeyInfo(id);
    });

    // External URL opening
    ipcMain.handle('open-external-url', async (event, url: string) => {
      try {
        await shell.openExternal(url);
        return true;
      } catch (error) {
        this.printLogMessage('Error opening external URL:', error);
        return false;
      }
    });

    // Window controls
    ipcMain.handle('minimize-window', () => {
      this.browserWindow?.minimize();
    });

    ipcMain.handle('close-window', () => {
      this.browserWindow?.close();
    });

    // Widget-specific hotkey info handler
    ipcMain.handle('widget-get-hotkey-info', () => {
      return this.hotkeyService.getHotkeyInfo('widget-toggle');
    });
  }

  /**
   *
   */


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
      await this.widgetController.toggleVisibility();
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

  /**
   * Cleanup resources when app is closing
   */
  public destroy(): void {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }
  }
}
