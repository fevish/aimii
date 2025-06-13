import React, { useEffect, useState } from 'react';
import './Widget.css';

// Import the interface from the service
import { CurrentGameInfo } from '../../browser/services/current-game.service';

// Type declaration for window object
declare global {
  interface Window {
    electronAPI?: {
      openWidgetDevTools: () => void;
    };
  }
}

const Widget: React.FC = () => {
  const [currentGame, setCurrentGame] = useState<CurrentGameInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentGame = async () => {
    try {
      // Use require since nodeIntegration is enabled
      const { ipcRenderer } = require('electron');
      const gameInfo = await ipcRenderer.invoke('widget-get-current-game');
      setCurrentGame(gameInfo);
    } catch (error) {
      console.error('Failed to fetch current game:', error);
      setCurrentGame(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Fetch initial game info
    fetchCurrentGame();

    // Set up periodic refresh to detect game changes
    const interval = setInterval(fetchCurrentGame, 2000); // Check every 2 seconds

    // Add hotkey listeners for dev tools
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey) {
        if (event.key === 'I' || event.key === 'C') {
          event.preventDefault();
          // Send IPC message to open dev tools
          if (window.electronAPI) {
            window.electronAPI.openWidgetDevTools();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="widget-container">
      <div className="widget-header">
        <h3>AIMII Widget</h3>
      </div>
      <div className="widget-content">
        <div className="current-game">
          {isLoading ? (
            <p className="game-status loading">Loading...</p>
          ) : currentGame ? (
            <div className="game-info">
              <p className="game-title">{currentGame.name}</p>
              <p className={`game-status ${currentGame.isSupported ? 'supported' : 'unsupported'}`}>
                {currentGame.isSupported ? '✓ Supported' : '⚠ Not Supported'}
              </p>
            </div>
          ) : (
            <p className="game-status no-game">No game detected</p>
          )}
        </div>
        <div className="widget-placeholder">
          <p>Mouse Sensitivity Converter</p>
          <p>Widget content goes here...</p>
        </div>
      </div>
    </div>
  );
};

export default Widget;