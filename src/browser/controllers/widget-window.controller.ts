import path from "path";
import { OverlayService } from "../services/overlay.service";
import { OverlayBrowserWindow, OverlayWindowOptions, PassthroughType, ZOrderType } from "@overwolf/ow-electron-packages-types";
import { SettingsService } from "../services/settings.service";

export class WidgetWindowController {
  private widgetWindow: OverlayBrowserWindow | null = null;
  private isVisible: boolean = false;
  private savePositionTimeout: NodeJS.Timeout | null = null;

  constructor(
    private readonly overlayService: OverlayService,
    private readonly settingsService: SettingsService
  ) {
    this.registerHotkey();
  }

  public get overlayBrowserWindow(): OverlayBrowserWindow | null {
    return this.widgetWindow;
  }

  public async createWidget(): Promise<void> {
    if (this.widgetWindow) {
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

    this.widgetWindow = await this.overlayService.createNewOsrWindow(options);

    await this.widgetWindow.window.loadURL(
      path.join(__dirname, '../widget/widget.html')
    );

    // Listen for game window changes (resolution changes, etc.)
    if (this.overlayService.overlayApi) {
      this.overlayService.overlayApi.on('game-window-changed', (windowInfo: any, gameInfo: any, reason: any) => {
        console.log('Game window changed, checking widget bounds...');
        this.checkAndRepositionWidget(windowInfo);
      });
    }

    // Restore visibility state
    const savedVisibility = this.settingsService.getWidgetVisible();
    if (savedVisibility) {
      this.show();
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

    // Log bounds status
    const isWithinBounds = bounds.x >= 0 &&
                          bounds.y >= 0 &&
                          bounds.x + bounds.width <= gameWidth &&
                          bounds.y + bounds.height <= gameHeight;
  }

  public toggleVisibility(): void {
    if (!this.widgetWindow) return;

    if (this.isVisible) {
      this.widgetWindow.window.hide();
      this.isVisible = false;
    } else {
      this.widgetWindow.window.show();
      this.isVisible = true;
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

      this.widgetWindow.window.close();
      this.widgetWindow = null;
      this.isVisible = false;
    }
  }

  public openDevTools(): void {
    if (!this.widgetWindow) return;
    this.widgetWindow.window.webContents.openDevTools({ mode: 'detach' });
  }

  private registerHotkey(): void {
    // We'll register the hotkey through the overlay service
    // The hotkey will be: Ctrl+Shift+W
    if (this.overlayService.overlayApi) {
      this.overlayService.overlayApi.hotkeys.register({
        name: "toggleWidget",
        keyCode: 87, // W key
        modifiers: {
          ctrl: true,
          shift: true
        },
        passthrough: true
      }, (hotkey, state) => {
        if (state === 'pressed') {
          this.toggleVisibility();
        }
      });

      // Add hotkey for dev tools: Ctrl+Shift+I
      this.overlayService.overlayApi.hotkeys.register({
        name: "openWidgetDevTools",
        keyCode: 73, // I key
        modifiers: {
          ctrl: true,
          shift: true
        },
        passthrough: true
      }, (hotkey, state) => {
        if (state === 'pressed') {
          this.openDevTools();
        }
      });
    }
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