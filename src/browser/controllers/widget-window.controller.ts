import path from 'path';
import { OverlayService } from '../services/overlay.service';
import { OverlayBrowserWindow, OverlayWindowOptions } from '@overwolf/ow-electron-packages-types';
import { SettingsService } from '../services/settings.service';
import { CurrentGameService } from '../services/current-game.service';
import { HotkeyService } from '../services/hotkey.service';
import { app, ipcMain } from 'electron';

export class WidgetWindowController {
  private widgetWindow: OverlayBrowserWindow | null = null;
  private isVisible: boolean = false;
  private savePositionTimeout: NodeJS.Timeout | null = null;
  private hotkeysRegistered: boolean = false;
  private gameWindowListenerAdded: boolean = false;
  private interceptionListenerAdded: boolean = false;
  private exclusiveModeListenerAdded: boolean = false;
  private pendingAutoShow: boolean = false;

  // Centralized hotkey configuration
  private readonly WIDGET_HOTKEY = {
    keyCode: 77, // M key
    modifiers: { ctrl: true, shift: true, alt: false },
    name: 'toggleWidget'
  };

  private readonly DEV_TOOLS_HOTKEY = {
    keyCode: 73, // I key
    modifiers: { ctrl: true, shift: true, alt: false },
    name: 'openWidgetDevTools'
  };

  constructor(
    private readonly overlayService: OverlayService,
    private readonly settingsService: SettingsService,
    private readonly currentGameService: CurrentGameService,
    private readonly hotkeyService: HotkeyService
  ) {
    this.registerWidgetIpc();

    // Listen for overlay service to be ready before registering hotkeys
    this.overlayService.on('ready', () => {
      this.registerHotkey();
    });

    // If overlay is already ready, register immediately
    if (this.overlayService.overlayApi) {
      this.registerHotkey();
    }


    // Listen for hotkey changes from settings
    this.hotkeyService.on('hotkey-changed', (id: string, updatedHotkey: any) => {
      if (id === 'widget-toggle') {
        this.hotkeysRegistered = false; // Reset registration flag
        this.registerHotkey(); // Re-register with new hotkey

        // Notify widget about hotkey change
        if (this.widgetWindow) {
          this.widgetWindow.window.webContents.send('hotkey-changed', id, updatedHotkey);
        }
      }
    });

    // Listen for hotkey reset
    this.hotkeyService.on('hotkeys-reset', () => {
      this.hotkeysRegistered = false; // Reset registration flag
      this.registerHotkey(); // Re-register with default hotkey

      // Notify widget about hotkey reset
      if (this.widgetWindow) {
        this.widgetWindow.window.webContents.send('hotkeys-reset');
      }
    });
  }

  public get overlayBrowserWindow(): OverlayBrowserWindow | null {
    return this.widgetWindow;
  }

  private registerWidgetIpc(): void {
    // Widget-specific IPC handlers
    ipcMain.handle('widget-get-current-game', () => {
      return this.currentGameService.getCurrentGameInfo();
    });

    ipcMain.handle('widget-get-baseline-settings', () => {
      return this.settingsService.getBaselineSettings();
    });

    ipcMain.handle('widget-get-suggested-sensitivity', () => {
      // We need access to the sensitivity converter service
      // For now, we'll calculate it directly here
      const baselineSettings = this.settingsService.getBaselineSettings();
      const currentGame = this.currentGameService.getCurrentGameInfo();

      if (!baselineSettings || !currentGame || !currentGame.isSupported) {
        return null;
      }

      // Return the data needed for conversion - the main window will handle the calculation
      return {
        baselineSettings,
        currentGame
      };
    });
  }

  public async createWidget(): Promise<void> {
    if (this.widgetWindow) {
      return; // Widget already exists
    }

    const options: OverlayWindowOptions = {
      name: 'aimii-widget',
      height: 250,
      width: 400,
      title: 'aimii In-Game Widget',
      show: false, // Start hidden
      transparent: true, // Frameless overlay
      resizable: false, // Keep fixed size
      frame: false, // No title bar
      passthrough: 'noPassThrough',
      zOrder: 'topMost',
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        devTools: !app.isPackaged,
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

    this.widgetWindow = await this.overlayService.createNewOsrWindow(options);

    await this.widgetWindow.window.loadFile(
      path.join(__dirname, '../widget/widget.html')
    );

    // Listen for game window changes (resolution changes, etc.) — only add once
    if (this.overlayService.overlayApi && !this.gameWindowListenerAdded) {
      this.overlayService.overlayApi.on('game-window-changed', (windowInfo: any) => {
        this.checkAndRepositionWidget(windowInfo);
      });
      this.gameWindowListenerAdded = true;
    }

    if (this.overlayService.overlayApi && !this.interceptionListenerAdded) {
      // When game captures input: re-enter exclusive mode if widget is visible,
      // or try to enter it so the exclusive-mode-changed event fires for pending auto-show
      this.overlayService.overlayApi.on('game-input-interception-changed', () => {
        if (this.isVisible || this.pendingAutoShow) {
          this.enterExclusiveModeIfNeeded();
        }
      });
      this.interceptionListenerAdded = true;
    }

    if (this.overlayService.overlayApi && !this.exclusiveModeListenerAdded) {
      // For exclusive-mode games with auto-show: show widget only once exclusive mode is active
      this.overlayService.overlayApi.on('game-input-exclusive-mode-changed', (info: any) => {
        if (info.exclusiveMode && this.pendingAutoShow) {
          this.pendingAutoShow = false;
          this.widgetWindow?.window.show();
          this.isVisible = true;
        }
      });
      this.exclusiveModeListenerAdded = true;
    }

    // Show widget if auto-show is enabled
    if (this.settingsService.getWidgetAutoShow()) {
      const currentGame = this.currentGameService.getCurrentGameInfo();
      if (currentGame?.gameData?.exclusive_mode) {
        // Defer show until exclusive mode is confirmed active
        this.pendingAutoShow = true;
        this.enterExclusiveModeIfNeeded();
      } else {
        this.show();
      }
    }

    this.registerWindowEvents();
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

  }

  public toggleVisibility(): void {
    if (!this.widgetWindow) return;

    if (this.isVisible) {
      this.widgetWindow.window.hide();
      this.isVisible = false;
      this.exitExclusiveModeIfActive();
    } else {
      this.widgetWindow.window.show();
      this.isVisible = true;
      this.enterExclusiveModeIfNeeded();
    }
  }

  public show(): void {
    if (!this.widgetWindow) return;
    this.widgetWindow.window.show();
    this.isVisible = true;
    this.enterExclusiveModeIfNeeded();
  }

  public hide(): void {
    if (!this.widgetWindow) return;
    this.widgetWindow.window.hide();
    this.isVisible = false;
    this.exitExclusiveModeIfActive();
  }

  private enterExclusiveModeIfNeeded(): void {
    const currentGame = this.currentGameService.getCurrentGameInfo();
    if (!currentGame?.gameData?.exclusive_mode) return;
    this.overlayService.overlayApi?.enterExclusiveMode();
  }

  private exitExclusiveModeIfActive(): void {
    // Call unconditionally — the API is a no-op when not in exclusive mode
    this.overlayService.overlayApi?.exitExclusiveMode();
  }

  public destroy(): void {
    if (this.widgetWindow) {
      this.exitExclusiveModeIfActive();

      // Save final position before destroying
      const bounds = this.widgetWindow.window.getBounds();
      this.settingsService.setWidgetPosition(bounds.x, bounds.y);

      // Clear any pending timeouts
      if (this.savePositionTimeout) {
        clearTimeout(this.savePositionTimeout);
        this.savePositionTimeout = null;
      }

      this.widgetWindow.window.close();
      this.widgetWindow = null;
      this.isVisible = false;
      this.hotkeysRegistered = false;
      this.gameWindowListenerAdded = false;
      this.interceptionListenerAdded = false;
      this.exclusiveModeListenerAdded = false;
      this.pendingAutoShow = false;
    }
  }

  public openDevTools(): void {
    if (!this.widgetWindow) return;
    this.widgetWindow.window.webContents.openDevTools({ mode: 'detach' });
  }

  public getHotkeyInfo(): { keyCode: number; modifiers: { ctrl: boolean; shift: boolean; alt: boolean }; displayText: string } {
    // Get hotkey info from the HotkeyService
    const hotkeyInfo = this.hotkeyService.getHotkeyInfo('widget-toggle');

    if (hotkeyInfo) {
      return hotkeyInfo;
    }

    // Fallback to default configuration if hotkey service doesn't have it
    const { keyCode, modifiers } = this.WIDGET_HOTKEY;

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

  private registerHotkey(): void {
    // Prevent duplicate registrations
    if (this.hotkeysRegistered || !this.overlayService.overlayApi) {
      return;
    }

    // Get current widget hotkey configuration from HotkeyService
    const widgetHotkeyInfo = this.hotkeyService.getHotkeyInfo('widget-toggle');
    if (!widgetHotkeyInfo) {
      return;
    }

    // Register widget toggle hotkey with current configuration
    this.overlayService.overlayApi.hotkeys.register({
      name: this.WIDGET_HOTKEY.name,
      keyCode: widgetHotkeyInfo.keyCode,
      modifiers: {
        ctrl: widgetHotkeyInfo.modifiers.ctrl,
        shift: widgetHotkeyInfo.modifiers.shift,
        alt: widgetHotkeyInfo.modifiers.alt
      },
      passthrough: false
    }, (_hotkey, state) => {
      if (state === 'pressed') {
        this.toggleVisibility();
      }
    });

    if (!app.isPackaged) {
      this.overlayService.overlayApi.hotkeys.register({
        name: this.DEV_TOOLS_HOTKEY.name,
        keyCode: this.DEV_TOOLS_HOTKEY.keyCode,
        modifiers: {
          ctrl: this.DEV_TOOLS_HOTKEY.modifiers.ctrl,
          shift: this.DEV_TOOLS_HOTKEY.modifiers.shift
        },
        passthrough: false
      }, (_hotkey, state) => {
        if (state === 'pressed') {
          this.openDevTools();
        }
      });
    }

    this.hotkeysRegistered = true;
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

  }
}
