import React from 'react';
import './UpdateNotice.css';
import { UpdaterStatus } from './useUpdater';

interface UpdateNoticeProps {
  isOpen: boolean;
  status: UpdaterStatus;
  version: string | null;
  progressPercent: number;
  /** True once the user clicked "Install now" — the app is about to restart to install. */
  isInstalling: boolean;
  errorMessage: string | null;
  onInstallNow: () => void;
  onClose: () => void;
}

/**
 * Update modal opened from the header button. Updates download automatically and install on
 * the next restart — there is no defer/skip choice. The modal informs the user of the pending
 * update and offers to install it now (restart immediately).
 */
export const UpdateNotice: React.FC<UpdateNoticeProps> = ({
  isOpen,
  status,
  version,
  progressPercent,
  isInstalling,
  errorMessage,
  onInstallNow,
  onClose
}) => {
  if (!isOpen) return null;

  const versionLabel = version ? ` (v${version})` : '';
  const hasUpdate = status === 'available' || status === 'downloading' || status === 'downloaded';

  return (
    <div className="update-modal-backdrop" onClick={onClose}>
      <div
        className="update-modal"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {isInstalling ? (
          <>
            <h2 className="update-modal-title">Installing update</h2>
            <p className="update-modal-body">
              aimii.app will restart to finish installing the update{versionLabel}.
            </p>
            {status === 'downloading' && (
              <div className="update-modal-progress">
                <div className="update-modal-progress-bar" style={{ width: `${progressPercent}%` }} />
              </div>
            )}
          </>
        ) : hasUpdate ? (
          <>
            <h2 className="update-modal-title">Update available</h2>
            <p className="update-modal-body">
              An update{versionLabel} is available and will be installed automatically the next
              time you restart aimii.app.
            </p>
            <div className="update-modal-actions">
              <button className="btn btn-outline" onClick={onClose}>Close</button>
              <button className="btn btn-primary" onClick={onInstallNow}>Install now</button>
            </div>
          </>
        ) : status === 'error' ? (
          <>
            <h2 className="update-modal-title">Update failed</h2>
            <p className="update-modal-body">{errorMessage || 'Something went wrong while updating. Please try again later.'}</p>
            <div className="update-modal-actions">
              <button className="btn btn-primary" onClick={onClose}>Close</button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
