import { useCallback, useEffect, useState } from 'react';

export type UpdaterStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'not-available'
  | 'error';

export interface UpdaterState {
  /** Current point in the update lifecycle. */
  status: UpdaterStatus;
  /** Version offered by an available/downloaded update (null until known). */
  version: string | null;
  /** Version of the running app. */
  currentVersion: string;
  /** Download progress 0-100 while status is 'downloading'. */
  progressPercent: number;
  /** Last error message, if status is 'error'. */
  errorMessage: string | null;
  /** Manually re-check the feed. */
  check: () => void;
  /** Start downloading an available update. */
  download: () => void;
  /** Quit and install a downloaded update. */
  restart: () => void;
}

/**
 * Subscribes to main-process updater events and drives an initial check on mount (after
 * listeners are attached, so no events are missed). User-prompted flow: an `available`
 * status appears first, then the user triggers download() and finally restart().
 *
 * Mount this hook in exactly one place — the preload bridge uses removeAllListeners on
 * cleanup, so a second concurrent subscriber would clobber the first's listeners.
 */
export function useUpdater(): UpdaterState {
  const [status, setStatus] = useState<UpdaterStatus>('idle');
  const [version, setVersion] = useState<string | null>(null);
  const [currentVersion, setCurrentVersion] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const v = await window.updater.getVersion();
        if (mounted) setCurrentVersion(v);
      } catch (error) {
        console.error('Failed to get app version:', error);
      }
    })();

    try {
      window.updater.onChecking(() => setStatus('checking'));
      window.updater.onUpdateAvailable(info => {
        setVersion(info.version);
        setStatus('available');
      });
      window.updater.onUpdateNotAvailable(() => setStatus('not-available'));
      window.updater.onDownloadProgress(percent => {
        setProgressPercent(percent);
        setStatus('downloading');
      });
      window.updater.onUpdateDownloaded(info => {
        setVersion(info.version);
        setProgressPercent(100);
        setStatus('downloaded');
      });
      window.updater.onError(message => {
        setErrorMessage(message);
        setStatus('error');
      });

      // The automatic launch check is triggered by the main process after the window
      // finishes loading (see MainWindowController) — more reliable on a cold start than
      // checking the instant this hook mounts. Manual checks go through `check()` below.
    } catch (error) {
      console.error('Error setting up updater listeners:', error);
    }

    return () => {
      mounted = false;
      try {
        window.updater?.removeUpdaterListeners?.();
      } catch (error) {
        console.error('Error removing updater listeners:', error);
      }
    };
  }, []);

  const check = useCallback(() => {
    setErrorMessage(null);
    setStatus('checking');
    window.updater.checkForUpdates();
  }, []);

  const download = useCallback(() => {
    setProgressPercent(0);
    setStatus('downloading');
    window.updater.downloadUpdate();
  }, []);

  const restart = useCallback(() => {
    window.updater.quitAndInstall();
  }, []);

  return {
    status,
    version,
    currentVersion,
    progressPercent,
    errorMessage,
    check,
    download,
    restart
  };
}
