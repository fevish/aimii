import { app as ElectronApp } from 'electron';
import { EventEmitter } from 'events';
import { autoUpdater, UpdateInfo, ProgressInfo } from 'electron-updater';

/**
 * Wraps electron-updater. Checks the Overwolf CDN feed configured via the `publish`
 * block in package.json and re-emits status as plain, serializable events for the renderer.
 *
 * UX is user-prompted: autoDownload is off, so an `available` event fires first; the
 * renderer calls downloadUpdate(), then quitAndInstall() once `downloaded` fires.
 *
 * electron-updater refuses to run in unpacked/dev builds, so every method is a guarded
 * no-op unless ElectronApp.isPackaged. Failures are logged and surfaced via `error` —
 * they never throw out of this service.
 */
export class UpdaterService extends EventEmitter {
  constructor() {
    super();

    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => this.emit('checking'));
    autoUpdater.on('update-available', (info: UpdateInfo) =>
      this.emit('available', { version: info.version }));
    autoUpdater.on('update-not-available', (info: UpdateInfo) =>
      this.emit('not-available', { version: info.version }));
    autoUpdater.on('download-progress', (progress: ProgressInfo) =>
      this.emit('download-progress', Math.round(progress.percent)));
    autoUpdater.on('update-downloaded', (info: UpdateInfo) =>
      this.emit('downloaded', { version: info.version }));
    autoUpdater.on('error', (err: Error) =>
      this.emit('error', err?.message ?? String(err)));
  }

  /** electron-updater only works in packaged builds. */
  public isSupported(): boolean {
    return ElectronApp.isPackaged;
  }

  public getCurrentVersion(): string {
    return ElectronApp.getVersion();
  }

  public async checkForUpdates(): Promise<void> {
    if (!this.isSupported()) {
      console.log('[updater] skipped check — updates only run in packaged builds');
      this.emit('not-available', { version: this.getCurrentVersion() });
      return;
    }

    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('[updater] check failed:', error);
      this.emit('error', error instanceof Error ? error.message : String(error));
    }
  }

  public async downloadUpdate(): Promise<void> {
    if (!this.isSupported()) {
      console.log('[updater] skipped download — updates only run in packaged builds');
      return;
    }

    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('[updater] download failed:', error);
      this.emit('error', error instanceof Error ? error.message : String(error));
    }
  }

  /** Quits and installs the staged update. Only call after a `downloaded` event. */
  public quitAndInstall(): void {
    if (!this.isSupported()) return;

    autoUpdater.quitAndInstall();
  }
}
