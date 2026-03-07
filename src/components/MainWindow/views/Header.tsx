import React from 'react';
import { SvgIcon } from '../../SvgIcon/SvgIcon';

interface HeaderProps {
  activeTab: 'main' | 'settings';
  setActiveTab: (tab: 'main' | 'settings') => void;
  showOnboarding: boolean;
  onMinimize: () => void;
  onClose: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  showOnboarding,
  onMinimize,
  onClose,
}) => {
  return (
    <header className="app-header">
      <div className="app-logo">
        <h1>aimii.app</h1>
        <span className="version">v{process.env.APP_VERSION}</span>
      </div>
      <div className="header-controls">
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
