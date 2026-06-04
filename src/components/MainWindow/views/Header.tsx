import React from 'react';
import { SvgIcon } from '../../SvgIcon/SvgIcon';
import { UpdaterStatus } from '../../UpdateNotice/useUpdater';

interface HeaderProps {
  activeTab: 'main' | 'settings';
  setActiveTab: (tab: 'main' | 'settings') => void;
  showOnboarding: boolean;
  onMinimize: () => void;
  onClose: () => void;
  updaterStatus: UpdaterStatus;
  updaterProgress: number;
  onUpdateAction: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  showOnboarding,
  onMinimize,
  onClose,
  updaterStatus,
  updaterProgress,
  onUpdateAction,
}) => {
  const showUpdateButton =
    !showOnboarding &&
    (updaterStatus === 'available' || updaterStatus === 'downloading' || updaterStatus === 'downloaded');
  return (
    <header className="app-header">
      <div className="app-logo">
        <SvgIcon name="aimii-logo" />
        <div className="title">
          <h1>aimii.app</h1>
          <span className="version">v{process.env.APP_VERSION}</span>
        </div>
      </div>
      <div className="header-controls">
        {showUpdateButton && (
          <button
            className="tab-button header-update-btn"
            onClick={onUpdateAction}
            title="A new version of aimii is available"
          >
            {updaterStatus === 'available' && 'Update Available'}
            {updaterStatus === 'downloading' && `Updating… ${updaterProgress}%`}
            {updaterStatus === 'downloaded' && 'Restart to update'}
          </button>
        )}
        {!showOnboarding && (
          <nav className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'main' ? 'active' : ''}`}
              onClick={() => setActiveTab('main')}
            >
              <SvgIcon name="home" />
            </button>
            <button
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <SvgIcon name="settings" />
            </button>
            <button className="tab-button discord-btn" onClick={() => window.electronAPI?.openExternalUrl('https://discord.gg/Nj2Xj3W4eY')}><SvgIcon name="discord" /></button>
          </nav>
        )}
        <div className="window-controls">
          <button onClick={onMinimize} className="window-control-btn minimize-btn">_</button>
          <button onClick={onClose} className="window-control-btn close-btn">✕</button>
        </div>
      </div>
    </header>
  );
};
