import path from "path";
import { OverlayService } from "../services/overlay.service";
import { OverlayBrowserWindow, OverlayWindowOptions, PassthroughType, ZOrderType } from "@overwolf/ow-electron-packages-types";
import { SettingsService } from "../services/settings.service";
import { CurrentGameService } from "../services/current-game.service";
import { HotkeyService } from "../services/hotkey.service";
import { ipcMain } from "electron";

export class WidgetWindowController {
  private widgetWindow: OverlayBrowserWindow | null = null;
  private isVisible: boolean = false;
  private savePositionTimeout: NodeJS.Timeout | null = null;
  private hotkeysRegistered: boolean = false; // Prevent duplicate registrations
  private static ipcHandlersRegistered: boolean = false; // Static flag to prevent duplicate IPC handler registrations across all instances

  constructor(
    private readonly overlayService: OverlayService,
    private readonly settingsService: SettingsService,
    private readonly currentGameService: CurrentGameService,
    private readonly hotkeyService: HotkeyService
  ) {
    this.registerWidgetIpc();

    // Listen for overlay service to be ready before registering hotkeys
    this.overlayService.on('ready', () => {
      console.log('[WidgetWindowController] Overlay service ready, registering hotkeys');
      this.registerHotkey();
    });

    // Listen for hotkey changes
    this.hotkeyService.on('hotkey-changed', (id: string, hotkey: any) => {
      if (id === 'widget-toggle') {
        console.log('[WidgetWindowController] Widget toggle hotkey changed, re-registering');
        this.reregisterHotkeys();
      }
    });
  }

  public get overlayBrowserWindow(): OverlayBrowserWindow | null {
    return this.widgetWindow;
  }

  private registerWidgetIpc(): void {
    // Prevent duplicate registrations
    if (WidgetWindowController.ipcHandlersRegistered) {
      return;
    }

    // Widget-specific IPC handlers
    ipcMain.handle('widget-get-current-game', () => {
      return this.currentGameService.getCurrentGameInfo();
    });

    ipcMain.handle('widget-get-canonical-settings', () => {
      return this.settingsService.getCanonicalSettings();
    });

    ipcMain.handle('widget-get-suggested-sensitivity', () => {
      // We need access to the sensitivity converter service
      // For now, we'll calculate it directly here
      const canonicalSettings = this.settingsService.getCanonicalSettings();
      const currentGame = this.currentGameService.getCurrentGameInfo();

      if (!canonicalSettings || !currentGame || !currentGame.isSupported) {
        return null;
      }

      // Don't suggest conversion if we're already in the canonical game
      if (canonicalSettings.game === currentGame.name) {
        return null;
      }

      // Return the data needed for conversion - the main window will handle the calculation
      return {
        canonicalSettings,
        currentGame
      };
    });

    WidgetWindowController.ipcHandlersRegistered = true;
  }

  public async createWidget(): Promise<void> {
    console.log('[WidgetWindowController] createWidget called');
    if (this.widgetWindow) {
      console.log('[WidgetWindowController] Widget window already exists');
      return; // Widget already exists
    }

    const options: OverlayWindowOptions = {
      name: 'aimii-widget',
      height: 500,
      width: 300,
      title: 'AIMII Widget',
      show: false, // Start hidden
      transparent: true, // Frameless overlay
      resizable: false, // Keep fixed size
      frame: false, // No title bar
      passthrough: PassthroughType.NoPassThrough,
      zOrder: ZOrderType.TopMost,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: true,
      },
    };

    // Use saved position or calculate default position
    const savedPosition = this.settingsService.getWidgetPosition();
    const activeGame = this.overlayService.overlayApi?.getActiveGameInfo();
    const gameWindowInfo = activeGame?.gameWindowInfo;

    if (savedPosition.x !== 100 || savedPosition.y !== 100) {
      // Use saved position if it's not the default
      options.x = savedPosition.x;
      options.y = savedPosition.y;
    } else if (gameWindowInfo) {
      // Calculate default position (top-right corner)
      options.x = gameWindowInfo.size.width - 320; // 300 + 20px margin
      options.y = 20;
    } else {
      // Use saved position as fallback
      options.x = savedPosition.x;
      options.y = savedPosition.y;
    }

    console.log('[WidgetWindowController] Creating overlay window with options:', options);
    try {
      this.widgetWindow = await this.overlayService.createNewOsrWindow(options);
      console.log('[WidgetWindowController] Widget window created:', !!this.widgetWindow);
    } catch (error) {
      console.error('[WidgetWindowController] Failed to create overlay window:', error);
      throw error;
    }

    try {
      await this.widgetWindow.window.loadFile(
        path.join(__dirname, '../widget/widget.html')
      );
      console.log('[WidgetWindowController] Widget HTML loaded');
    } catch (error) {
      console.error('[WidgetWindowController] Failed to load widget HTML:', error);
      throw error;
    }

    // Listen for game window changes (resolution changes, etc.)
    if (this.overlayService.overlayApi) {
      this.overlayService.overlayApi.on('game-window-changed', (windowInfo: any, gameInfo: any, reason: any) => {
        this.checkAndRepositionWidget(windowInfo);
      });
    }

    // Restore visibility state
    const savedVisibility = this.settingsService.getWidgetVisible();
    if (savedVisibility) {
      this.show();
    }

    this.registerWindowEvents();

    // Ensure hotkeys are registered when widget is created
    this.registerHotkey();

    console.log('[WidgetWindowController] createWidget completed, widgetWindow exists:', !!this.widgetWindow);
  }

  private checkAndRepositionWidget(windowInfo?: any): void {
    if (!this.widgetWindow) return;

    const bounds = this.widgetWindow.window.getBounds();
    let gameWidth = 2560; // Default fallback
    let gameHeight = 1440; // Default fallback

    // Use provided windowInfo or get current game info
    if (windowInfo?.size) {
      gameWidth = windowInfo.size.width;
      gameHeight = windowInfo.size.height;
    } else {
      const activeGame = this.overlayService.overlayApi?.getActiveGameInfo();
      if (activeGame?.gameWindowInfo?.size) {
        gameWidth = activeGame.gameWindowInfo.size.width;
        gameHeight = activeGame.gameWindowInfo.size.height;
      } else {
        // Use screen dimensions as fallback
        const { screen } = require('electron');
        const primaryDisplay = screen.getPrimaryDisplay();
        gameWidth = primaryDisplay.workAreaSize.width;
        gameHeight = primaryDisplay.workAreaSize.height;
      }
    }

    // Calculate restricted bounds
    let newX = bounds.x;
    let newY = bounds.y;
    let needsReposition = false;

    // Restrict to game bounds
    if (newX < 0) {
      newX = 0;
      needsReposition = true;
    }
    if (newY < 0) {
      newY = 0;
      needsReposition = true;
    }
    if (newX + bounds.width > gameWidth) {
      newX = gameWidth - bounds.width;
      needsReposition = true;
    }
    if (newY + bounds.height > gameHeight) {
      newY = gameHeight - bounds.height;
      needsReposition = true;
    }

    // Apply restriction if needed
    if (needsReposition) {
      this.widgetWindow.window.setPosition(newX, newY);
    }

    // Log bounds status
    const isWithinBounds = bounds.x >= 0 &&
                          bounds.y >= 0 &&
                          bounds.x + bounds.width <= gameWidth &&
                          bounds.y + bounds.height <= gameHeight;
  }

  public async toggleVisibility(): Promise<void> {
    console.log('[WidgetWindowController] toggleVisibility called. isVisible:', this.isVisible, 'widgetWindow exists:', !!this.widgetWindow);

    // If widget window doesn't exist, create it first
    if (!this.widgetWindow) {
      console.log('[WidgetWindowController] Widget window not created, creating it first');
      try {
        await this.createWidget();
        // After creation, show the widget
        const widgetWindow = this.widgetWindow;
        if (widgetWindow && widgetWindow.window) {
          widgetWindow.window.show();
          this.isVisible = true;
          console.log('[WidgetWindowController] Widget created and shown');
        } else {
          console.error('[WidgetWindowController] Widget window still null after creation');
        }
      } catch (error) {
        console.error('[WidgetWindowController] Failed to create widget:', error);
      }
      return;
    }

    if (this.isVisible) {
      this.widgetWindow.window.hide();
      this.isVisible = false;
      console.log('[WidgetWindowController] Widget hidden');
    } else {
      this.widgetWindow.window.show();
      this.isVisible = true;
      console.log('[WidgetWindowController] Widget shown');
    }
  }

  public show(): void {
    if (!this.widgetWindow) return;
    this.widgetWindow.window.show();
    this.isVisible = true;
    this.settingsService.setWidgetVisible(true);
  }

  public hide(): void {
    if (!this.widgetWindow) return;
    this.widgetWindow.window.hide();
    this.isVisible = false;
    this.settingsService.setWidgetVisible(false);
  }

  public destroy(): void {
    if (this.widgetWindow) {
      // Save final position before destroying
      const bounds = this.widgetWindow.window.getBounds();
      this.settingsService.setWidgetPosition(bounds.x, bounds.y);
      this.settingsService.setWidgetVisible(false);

      // Clear any pending timeouts
      if (this.savePositionTimeout) {
        clearTimeout(this.savePositionTimeout);
        this.savePositionTimeout = null;
      }

      this.widgetWindow.window.close();
      this.widgetWindow = null;
      this.isVisible = false;
    }
  }

  public openDevTools(): void {
    if (!this.widgetWindow) return;
    this.widgetWindow.window.webContents.openDevTools({ mode: 'detach' });
  }

  public getHotkeyInfo(): { keyCode: number; modifiers: { ctrl: boolean; shift: boolean; alt: boolean }; displayText: string } {
    // Get widget hotkey info from the hotkey service
    const hotkeyInfo = this.hotkeyService.getHotkeyInfo('widget-toggle');
    if (!hotkeyInfo) {
      // Fallback to default values if hotkey not found
      return {
        keyCode: 77, // M key
        modifiers: { ctrl: true, shift: true, alt: false },
        displayText: 'Ctrl+Shift+M'
      };
    }
    return hotkeyInfo;
  }

  private registerHotkey(): void {
    // Prevent duplicate registrations
    if (this.hotkeysRegistered || !this.overlayService.overlayApi) {
      console.log('[WidgetWindowController] registerHotkey: Already registered or overlayApi not ready');
      return;
    }

    // Get widget toggle hotkey from service
    const widgetHotkey = this.hotkeyService.getHotkey('widget-toggle');
    console.log('[WidgetWindowController] registerHotkey: Registering widget toggle hotkey', widgetHotkey);

    if (!widgetHotkey) {
      console.error('[WidgetWindowController] Widget toggle hotkey not found');
      return;
    }

    // Register widget toggle hotkey
    this.overlayService.overlayApi.hotkeys.register({
      name: 'widget-toggle',
      keyCode: widgetHotkey.keyCode,
      modifiers: {
        ctrl: widgetHotkey.modifiers.ctrl,
        shift: widgetHotkey.modifiers.shift,
        alt: widgetHotkey.modifiers.alt
      },
      passthrough: true
    }, (hotkey, state) => {
      console.log('[WidgetWindowController] Hotkey callback:', hotkey, state);
      if (state === 'pressed') {
        this.toggleVisibility().catch(error => {
          console.error('[WidgetWindowController] Hotkey toggle failed:', error);
        });
      }
    });

    // Register dev tools hotkey (hardcoded as Ctrl+Shift+I)
    this.overlayService.overlayApi.hotkeys.register({
      name: 'widget-dev-tools',
      keyCode: 73, // I key
      modifiers: {
        ctrl: true,
        shift: true,
        alt: false
      },
      passthrough: true
    }, (hotkey, state) => {
      if (state === 'pressed') {
        this.openDevTools();
      }
    });

    this.hotkeysRegistered = true;
    console.log('[WidgetWindowController] registerHotkey: Registration complete');
  }

  private reregisterHotkeys(): void {
    console.log('[WidgetWindowController] Re-registering hotkeys');
    this.hotkeysRegistered = false;
    this.registerHotkey();
  }

  private registerWindowEvents(): void {
    if (!this.widgetWindow) return;

    this.widgetWindow.window.on('closed', () => {
      this.widgetWindow = null;
      this.isVisible = false;
    });

    // Log window move events to track positioning
    this.widgetWindow.window.on('moved', () => {
      if (this.widgetWindow) {
        const bounds = this.widgetWindow.window.getBounds();
        this.checkAndRepositionWidget();

        // Save position with debouncing (wait 500ms after last move)
        if (this.savePositionTimeout) {
          clearTimeout(this.savePositionTimeout);
        }
        this.savePositionTimeout = setTimeout(() => {
          this.settingsService.setWidgetPosition(bounds.x, bounds.y);
        }, 500);
      }
    });

    // Log resize events
    this.widgetWindow.window.on('resized', () => {
      if (this.widgetWindow) {
        const bounds = this.widgetWindow.window.getBounds();
      }
    });
  }
}