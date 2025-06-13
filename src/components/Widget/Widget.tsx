import React, { useEffect, useState } from 'react';
import './Widget.css';

// Import the interface from the service
import { CurrentGameInfo } from '../../browser/services/current-game.service';
import { SensitivityConversion } from '../../browser/services/sensitivity-converter.service';

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
  const [suggestedSensitivity, setSuggestedSensitivity] = useState<SensitivityConversion | null>(null);
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
    }
  };

  const fetchSuggestedSensitivity = async () => {
    try {
      const { ipcRenderer } = require('electron');
      const suggestion = await ipcRenderer.invoke('sensitivity-get-suggested-for-current-game');
      setSuggestedSensitivity(suggestion);
    } catch (error) {
      console.error('Failed to fetch suggested sensitivity:', error);
      setSuggestedSensitivity(null);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchCurrentGame(), fetchSuggestedSensitivity()]);
    setIsLoading(false);
  };

  useEffect(() => {
    // Fetch initial data
    fetchData();

    // Set up periodic refresh to detect game changes
    const interval = setInterval(fetchData, 2000); // Check every 2 seconds

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

        {suggestedSensitivity && (
          <div className="sensitivity-suggestion">
            <h4>Suggested Sensitivity</h4>
            <div className="suggestion-details">
              <p className="suggested-value">{suggestedSensitivity.suggestedSensitivity}</p>
              <p className="conversion-info">
                From {suggestedSensitivity.fromGame}: {suggestedSensitivity.fromSensitivity}
              </p>
              <p className="cm360-info">{suggestedSensitivity.cm360} cm/360°</p>
            </div>
          </div>
        )}

        <div className="widget-placeholder">
          <p>Mouse Sensitivity Converter</p>
          {!suggestedSensitivity && currentGame?.isSupported && (
            <p>Set canonical settings to see suggestions</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Widget;