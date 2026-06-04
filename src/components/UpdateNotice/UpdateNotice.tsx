import React from 'react';
import './UpdateNotice.css';
import { UpdaterStatus } from './useUpdater';

export type InstallIntent = 'now' | 'later' | null;

interface UpdateNoticeProps {
  isOpen: boolean;
  status: UpdaterStatus;
  version: string | null;
  progressPercent: number;
  installIntent: InstallIntent;
  errorMessage: string | null;
  onUpdateNow: () => void;
  onUpdateOnRestart: () => void;
  onRestartNow: () => void;
  onClose: () => void;
}

/**
 * Update modal for the user-prompted flow. Opened from the header button. Lets the user
 * choose to update now (download → restart) or on next restart (download in the
 * background; installs automatically on quit). Download progress is shown inline.
 */
export const UpdateNotice: React.FC<UpdateNoticeProps> = ({
  isOpen,
  status,
  version,
  progressPercent,
  installIntent,
  errorMessage,
  onUpdateNow,
  onUpdateOnRestart,
  onRestartNow,
  onClose
}) => {
  if (!isOpen) return null;

  const versionLabel = version ? ` (v${version})` : '';

  return (
    <div className="update-modal-backdrop" onClick={onClose}>
      <div
        className="update-modal"
        role="dialog"
        aria-modal="true"
        onClick={e => e.stopPropagation()}
      >
        {status === 'available' && (
          <>
            <h2 className="update-modal-title">Update Available</h2>
            <p className="update-modal-body">
              A new version{versionLabel} is available. When would you like to update?
            </p>
            <div className="update-modal-actions">
              <button className="btn btn-outline" onClick={onUpdateOnRestart}>On next restart</button>
              <button className="btn btn-primary" onClick={onUpdateNow}>Update now</button>
            </div>
          </>
        )}

        {status === 'downloading' && (
          <>
            <h2 className="update-modal-title">Downloading update</h2>
            <div className="update-modal-progress">
              <div className="update-modal-progress-bar" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="update-modal-body">
              {progressPercent}%
              {installIntent === 'later' && ' — it will install when you next restart aimii.'}
            </p>
            <div className="update-modal-actions">
              <button className="btn btn-outline" onClick={onClose}>Close</button>
            </div>
          </>
        )}

        {status === 'downloaded' && (
          <>
            <h2 className="update-modal-title">Update ready</h2>
            <p className="update-modal-body">
              {installIntent === 'now'
                ? `Update${versionLabel} downloaded — restarting to install…`
                : `Update${versionLabel} downloaded. It will install when you next restart aimii.`}
            </p>
            <div className="update-modal-actions">
              <button className="btn btn-outline" onClick={onClose}>Later</button>
              <button className="btn btn-primary" onClick={onRestartNow}>Restart now</button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="update-modal-title">Update failed</h2>
            <p className="update-modal-body">{errorMessage || 'Something went wrong while updating. Please try again later.'}</p>
            <div className="update-modal-actions">
              <button className="btn btn-primary" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
