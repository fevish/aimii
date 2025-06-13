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
  }
}