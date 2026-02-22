import { ipcMain, BrowserWindow, nativeImage } from 'electron';
import path from 'path';
import { WINDOW_CONFIG, AIM_TRAINER_HEADER_HEIGHT_PX } from '../services/window-state.service';
import type { AimTrainerConfig } from '../../types/aim-trainer';

export class AimTrainerWindowController {
  private window: BrowserWindow | null = null;
  private config: AimTrainerConfig | null = null;

  private loadAppIcon(): Electron.NativeImage {
    const isDev = process.resourcesPath.includes('node_modules');
    const iconPath = isDev
      ? path.join(process.cwd(), 'dist/icon.ico')
      : path.join(process.resourcesPath, '../icon.ico');
    return nativeImage.createFromPath(iconPath);
  }

  public createWindow(config: AimTrainerConfig): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.focus();
      this.config = config;
      this.window.webContents.send('aim-trainer-config-updated', config);
      return;
    }

    this.config = config;
    const { width, height } = config.resolution;
    const windowHeight = height + AIM_TRAINER_HEADER_HEIGHT_PX;

    this.window = new BrowserWindow({
      width,
      height: windowHeight,
      minWidth: WINDOW_CONFIG.aimTrainer.minWidth,
      minHeight: WINDOW_CONFIG.aimTrainer.minHeight,
      frame: WINDOW_CONFIG.aimTrainer.frame,
      resizable: WINDOW_CONFIG.aimTrainer.resizable,
      title: WINDOW_CONFIG.aimTrainer.title,
      icon: this.loadAppIcon(),
      show: false,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: true,
        devTools: true,
        preload: path.join(__dirname, '../preload/preload.js'),
      },
    });

    this.window.loadFile(path.join(__dirname, '..', 'aim-trainer.html'));

    this.window.once('ready-to-show', () => {
      this.window?.show();
      this.window?.focus();
      if (config.fullscreen) {
        this.window?.setFullScreen(true);
      }
    });

    this.window.on('closed', () => {
      this.window = null;
      this.config = null;
    });
  }

  public updateConfig(config: AimTrainerConfig): void {
    this.config = config;
    if (this.window && !this.window.isDestroyed()) {
      this.window.webContents.send('aim-trainer-config-updated', config);
      if (config.resolution) {
        const { width, height } = config.resolution;
        this.window.setSize(width, height + AIM_TRAINER_HEADER_HEIGHT_PX);
      }
    }
  }

  public closeWindow(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
      this.window = null;
      this.config = null;
    }
  }

  public getConfig(): AimTrainerConfig | null {
    return this.config;
  }

  public isOpen(): boolean {
    return this.window !== null && !this.window.isDestroyed();
  }

  public registerIpc(): void {
    ipcMain.handle('aim-trainer-open', (_, config: AimTrainerConfig) => {
      this.createWindow(config);
    });

    ipcMain.handle('aim-trainer-update-config', (_, config: AimTrainerConfig) => {
      this.updateConfig(config);
    });

    ipcMain.handle('aim-trainer-get-config', () => {
      return this.config;
    });

    ipcMain.handle('aim-trainer-close', () => {
      this.closeWindow();
    });

    ipcMain.handle('aim-trainer-is-open', () => {
      return this.isOpen();
    });
  }
}
