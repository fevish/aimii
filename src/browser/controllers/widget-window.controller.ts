import path from "path";
import { OverlayService } from "../services/overlay.service";
import { OverlayBrowserWindow, OverlayWindowOptions, PassthroughType, ZOrderType } from "@overwolf/ow-electron-packages-types";

export class WidgetWindowController {
  private widgetWindow: OverlayBrowserWindow | null = null;
  private isVisible: boolean = false;

  constructor(private readonly overlayService: OverlayService) {
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

    // Position widget in top-right corner
    const activeGame = this.overlayService.overlayApi?.getActiveGameInfo();
    const gameWindowInfo = activeGame?.gameWindowInfo;

    if (gameWindowInfo) {
      options.x = gameWindowInfo.size.width - 320; // 300 + 20px margin
      options.y = 20;
    }

    this.widgetWindow = await this.overlayService.createNewOsrWindow(options);

    await this.widgetWindow.window.loadURL(
      path.join(__dirname, '../widget/widget.html')
    );

    console.log('overlayApi:', this.overlayService.overlayApi);

    // Get specific game window info
    // const activeGameFull = this.overlayService.overlayApi?.getActiveGameInfo();
    // console.log('activeGame full object:', activeGameFull);

    // if (activeGameFull) {
    //   console.log('gameWindowInfo:', activeGameFull.gameWindowInfo);
    //   console.log('gameInfo:', activeGameFull.gameInfo);
    //   console.log('gameInputInfo:', activeGameFull.gameInputInfo);
    // }

    // // Try to get window bounds from overlay API
    // const allWindows = this.overlayService.overlayApi?.getAllWindows();
    // console.log('All overlay windows:', allWindows);

    // // Check if there's a way to get screen/game dimensions
    // if (this.overlayService.overlayApi) {
    //   console.log('Overlay API methods:', Object.getOwnPropertyNames(this.overlayService.overlayApi));
    // }

    this.registerWindowEvents();
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
  }

  public hide(): void {
    if (!this.widgetWindow) return;
    this.widgetWindow.window.hide();
    this.isVisible = false;
  }

  public destroy(): void {
    if (this.widgetWindow) {
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
        console.log('Widget moved to:', bounds);

        // Try multiple ways to get game bounds
        const activeGame = this.overlayService.overlayApi?.getActiveGameInfo();
        let gameWidth = 2560; // Default fallback
        let gameHeight = 1440; // Default fallback

        // Method 1: Try gameWindowInfo
        if (activeGame?.gameWindowInfo?.size) {
          gameWidth = activeGame.gameWindowInfo.size.width;
          gameHeight = activeGame.gameWindowInfo.size.height;
          console.log('Game bounds from gameWindowInfo:', { width: gameWidth, height: gameHeight });
        }
        // Method 2: Try to get from screen/display
        else {
          // Use screen dimensions as fallback
          const { screen } = require('electron');
          const primaryDisplay = screen.getPrimaryDisplay();
          gameWidth = primaryDisplay.workAreaSize.width;
          gameHeight = primaryDisplay.workAreaSize.height;
          console.log('Game bounds from screen:', { width: gameWidth, height: gameHeight });
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
          console.log('Restricting widget to bounds:', { x: newX, y: newY });
          this.widgetWindow.window.setPosition(newX, newY);
        }

        const isWithinBounds = bounds.x >= 0 &&
                              bounds.y >= 0 &&
                              bounds.x + bounds.width <= gameWidth &&
                              bounds.y + bounds.height <= gameHeight;
        console.log('Widget within game bounds:', isWithinBounds);
      }
    });

    // Log resize events
    this.widgetWindow.window.on('resized', () => {
      if (this.widgetWindow) {
        const bounds = this.widgetWindow.window.getBounds();
        console.log('Widget resized to:', bounds);
      }
    });
  }
}