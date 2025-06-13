import React, { useEffect, useState } from 'react';
import './Widget.css';

// Import the interface from the service
import { CurrentGameInfo } from '../../browser/services/current-game.service';
import { SensitivityConversion } from '../../browser/services/sensitivity-converter.service';

interface CanonicalSettings {
  game: string;
  sensitivity: number;
  dpi: number;
}

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
  const [canonicalSettings, setCanonicalSettings] = useState<CanonicalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentGame = async () => {
    try {
      // Use require since nodeIntegration is enabled
      const { ipcRenderer } = require('electron');
      const gameInfo = await ipcRenderer.invoke('widget-get-current-game');

      // Only update if the game info has actually changed
      setCurrentGame(prevGame => {
        if (!prevGame && !gameInfo) return prevGame;
        if (!prevGame || !gameInfo) return gameInfo;
        if (prevGame.id === gameInfo.id && prevGame.name === gameInfo.name && prevGame.isSupported === gameInfo.isSupported) {
          return prevGame; // No change, keep previous state
        }
        return gameInfo;
      });
    } catch (error) {
      console.error('Failed to fetch current game:', error);
      setCurrentGame(null);
    }
  };

  const fetchCanonicalSettings = async () => {
    try {
      const { ipcRenderer } = require('electron');
      const settings = await ipcRenderer.invoke('widget-get-canonical-settings');

      // Only update if settings have actually changed
      setCanonicalSettings(prevSettings => {
        if (!prevSettings && !settings) return prevSettings;
        if (!prevSettings || !settings) return settings;
        if (prevSettings.game === settings.game &&
            prevSettings.sensitivity === settings.sensitivity &&
            prevSettings.dpi === settings.dpi) {
          return prevSettings; // No change, keep previous state
        }
        return settings;
      });
    } catch (error) {
      console.error('Failed to fetch canonical settings:', error);
      setCanonicalSettings(null);
    }
  };

  const fetchSuggestedSensitivity = async () => {
    try {
      const { ipcRenderer } = require('electron');
      const suggestion = await ipcRenderer.invoke('sensitivity-get-suggested-for-current-game');

      // Only update if suggestion has actually changed
      setSuggestedSensitivity(prevSuggestion => {
        if (!prevSuggestion && !suggestion) return prevSuggestion;
        if (!prevSuggestion || !suggestion) return suggestion;
        if (prevSuggestion.fromGame === suggestion.fromGame &&
            prevSuggestion.toGame === suggestion.toGame &&
            prevSuggestion.suggestedSensitivity === suggestion.suggestedSensitivity) {
          return prevSuggestion; // No change, keep previous state
        }
        return suggestion;
      });
    } catch (error) {
      console.error('Failed to fetch suggested sensitivity:', error);
      setSuggestedSensitivity(null);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchCurrentGame(), fetchCanonicalSettings(), fetchSuggestedSensitivity()]);
    setIsLoading(false);
  };

  // Check if current game matches canonical game
  const isPlayingCanonicalGame = currentGame && canonicalSettings &&
    currentGame.name === canonicalSettings.game && currentGame.isSupported;

  useEffect(() => {
    // Fetch initial data
    fetchData();

    // Set up periodic refresh to detect game changes - reduced frequency
    const interval = setInterval(fetchData, 5000); // Check every 5 seconds instead of 2

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

        {isPlayingCanonicalGame ? (
          <div className="current-settings">
            <h4>Your Current Settings</h4>
            <div className="settings-details">
              <p className="setting-item"><span className="label">Game:</span> {canonicalSettings.game}</p>
              <p className="setting-item"><span className="label">Sensitivity:</span> {canonicalSettings.sensitivity}</p>
              <p className="setting-item"><span className="label">DPI:</span> {canonicalSettings.dpi}</p>
            </div>
          </div>
        ) : suggestedSensitivity ? (
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
        ) : null}

        <div className="widget-placeholder">
          <p>Mouse Sensitivity Converter</p>
          {!isPlayingCanonicalGame && !suggestedSensitivity && currentGame?.isSupported && (
            <p>Set canonical settings to see suggestions</p>
          )}
          {!currentGame?.isSupported && currentGame && (
            <p>Game not supported for conversion</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Widget;