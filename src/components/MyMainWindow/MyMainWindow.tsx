import React, { useState, useEffect } from 'react';
import { OverwolfTerminal } from '../OverwolfTerminal/OverwolfTerminal';
import './MyMainWindow.css';
import { CurrentGameInfo } from '../../browser/services/current-game.service';
import { SensitivityConversion } from '../../browser/services/sensitivity-converter.service';

interface GameData {
  game: string;
  sensitivityScalingFactor: number;
  owGameId: string;
  owConstant: string;
  owGameName: string;
  enable_for_app: boolean;
}

interface CanonicalSettings {
  game: string;
  sensitivity: number;
  dpi: number;
}

declare global {
  interface Window {
    games: {
      getAllGames: () => Promise<GameData[]>;
      getEnabledGames: () => Promise<GameData[]>;
      getGameSummary: () => Promise<string>;
      getEnabledGameIds: () => Promise<number[]>;
    };
    settings: {
      getCanonicalSettings: () => Promise<CanonicalSettings | null>;
      setCanonicalSettings: (game: string, sensitivity: number, dpi: number) => Promise<boolean>;
      hasCanonicalSettings: () => Promise<boolean>;
    };
    currentGame: {
      getCurrentGameInfo: () => Promise<CurrentGameInfo | null>;
      isGameRunning: () => Promise<boolean>;
      getCurrentGameName: () => Promise<string | null>;
      isCurrentGameSupported: () => Promise<boolean>;
      onGameChanged: (callback: (gameInfo: any) => void) => void;
      removeGameChangedListener: () => void;
    };
    widget: {
      createWidget: () => Promise<void>;
      toggleWidget: () => Promise<void>;
    };
    sensitivityConverter: {
      getSuggestedForCurrentGame: () => Promise<SensitivityConversion | null>;
      getAllConversions: () => Promise<SensitivityConversion[]>;
      convert: (fromGame: string, toGame: string, sensitivity: number, dpi: number) => Promise<SensitivityConversion | null>;
    };
  }
}

export const MyMainWindow: React.FC = () => {
  const [games, setGames] = useState<GameData[]>([]);
  const [canonicalSettings, setCanonicalSettings] = useState<CanonicalSettings | null>(null);
  const [currentGame, setCurrentGame] = useState<CurrentGameInfo | null>(null);
  const [suggestedSensitivity, setSuggestedSensitivity] = useState<SensitivityConversion | null>(null);
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [sensitivity, setSensitivity] = useState<string>('');
  const [dpi, setDpi] = useState<string>('800');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadGames();
    loadCanonicalSettings();
    loadCurrentGameData();

    // Set up listener for game change events using the preload API
    const handleGameChanged = (gameInfo: any) => {
      console.log('Game changed event received in main window:', gameInfo);
      loadCurrentGameData(); // Refresh game data when game changes
    };

    // Listen for game change events using the preload exposed API
    if (window.currentGame && window.currentGame.onGameChanged) {
      window.currentGame.onGameChanged(handleGameChanged);
    }

    // Fallback: reduced frequency polling for canonical settings changes
    // (since settings changes don't have events and we want to detect external changes)
    const settingsInterval = setInterval(loadCanonicalSettings, 15000); // Check settings every 15 seconds

    return () => {
      // Clean up game change listener
      if (window.currentGame && window.currentGame.removeGameChangedListener) {
        window.currentGame.removeGameChangedListener();
      }
      clearInterval(settingsInterval);
    };
  }, []);

  const loadGames = async () => {
    try {
      const enabledGames = await window.games.getEnabledGames();
      setGames(enabledGames.sort((a, b) => a.game.localeCompare(b.game)));
    } catch (error) {
      console.error('Error loading games:', error);
      setMessage('Error loading games data');
    }
  };

  const loadCanonicalSettings = async () => {
    try {
      const settings = await window.settings.getCanonicalSettings();
      if (settings) {
        setCanonicalSettings(settings);
        setSelectedGame(settings.game);
        setSensitivity(settings.sensitivity.toString());
        setDpi(settings.dpi.toString());
      }
    } catch (error) {
      console.error('Error loading canonical settings:', error);
    }
  };

  const loadCurrentGameData = async () => {
    try {
      const gameInfo = await window.currentGame.getCurrentGameInfo();

      // Only update if the game info has actually changed
      setCurrentGame(prevGame => {
        if (!prevGame && !gameInfo) return prevGame;
        if (!prevGame || !gameInfo) return gameInfo;
        if (prevGame.id === gameInfo.id && prevGame.name === gameInfo.name && prevGame.isSupported === gameInfo.isSupported) {
          return prevGame; // No change, keep previous state
        }
        return gameInfo;
      });

      if (window.sensitivityConverter) {
        const suggestion = await window.sensitivityConverter.getSuggestedForCurrentGame();

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
      }
    } catch (error) {
      console.error('Error loading current game data:', error);
    }
  };

  // Check if current game matches canonical game
  const isPlayingCanonicalGame = currentGame && canonicalSettings &&
    currentGame.name === canonicalSettings.game && currentGame.isSupported;

  const handleToggleWidget = async () => {
    try {
      await window.widget.toggleWidget();
    } catch (error) {
      console.error('Error toggling widget:', error);
      setMessage('Error toggling widget');
    }
  };

  const handleSaveCanonicalSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGame || !sensitivity || !dpi) {
      setMessage('Please fill in all fields');
      return;
    }

    const sensitivityNum = parseFloat(sensitivity);
    const dpiNum = parseInt(dpi);

    if (isNaN(sensitivityNum) || sensitivityNum <= 0) {
      setMessage('Please enter a valid sensitivity value');
      return;
    }

    if (isNaN(dpiNum) || dpiNum <= 0) {
      setMessage('Please enter a valid DPI value');
      return;
    }

    setIsLoading(true);
    try {
      await window.settings.setCanonicalSettings(selectedGame, sensitivityNum, dpiNum);

      // Update canonical settings state
      const newSettings = { game: selectedGame, sensitivity: sensitivityNum, dpi: dpiNum };
      setCanonicalSettings(newSettings);
      setMessage('Canonical settings saved successfully!');

      // Refresh current game data to update suggestions
      loadCurrentGameData();
    } catch (error) {
      console.error('Error saving canonical settings:', error);
      setMessage('Error saving settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-main-window">
      <header className="app-header">
        <h1>AIMII - Mouse Sensitivity Converter</h1>
        <p>Convert your mouse sensitivity between different games and devices</p>
      </header>

      <main className="app-content">
        <section className="canonical-settings-section">
          <h2>Canonical Game Settings</h2>
          <p>Set your preferred game, sensitivity, and DPI as your baseline for conversions.</p>

          {canonicalSettings && (
            <div className="current-settings">
              <h3>Current Settings:</h3>
              <p><strong>Game:</strong> {canonicalSettings.game}</p>
              <p><strong>Sensitivity:</strong> {canonicalSettings.sensitivity}</p>
              <p><strong>DPI:</strong> {canonicalSettings.dpi}</p>
            </div>
          )}

          <form onSubmit={handleSaveCanonicalSettings} className="canonical-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="game-select">Preferred Game:</label>
                <select
                  id="game-select"
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  required
                >
                  <option value="">Select your preferred game</option>
                  {games.map((game) => (
                    <option key={game.game} value={game.game}>
                      {game.game}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sensitivity-input">In-Game Sensitivity:</label>
                <input
                  id="sensitivity-input"
                  type="number"
                  step="any"
                  min="0.001"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value)}
                  placeholder="Enter your sensitivity"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dpi-input">Mouse DPI:</label>
                <input
                  id="dpi-input"
                  type="number"
                  min="1"
                  value={dpi}
                  onChange={(e) => setDpi(e.target.value)}
                  placeholder="Enter your mouse DPI"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="save-button">
              {isLoading ? 'Saving...' : 'Save Canonical Settings'}
            </button>
          </form>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </section>

        <section className="current-game-section">
          <h2>Current Game Status</h2>
          <div className="current-game-info">
            {currentGame ? (
              <div className="game-detected">
                <h3>{currentGame.name}</h3>
                <p className={`game-status ${currentGame.isSupported ? 'supported' : 'unsupported'}`}>
                  {currentGame.isSupported ? '✓ Supported' : '⚠ Not Supported'}
                </p>

                {isPlayingCanonicalGame ? (
                  <div className="current-settings-display">
                    <h4>Your Current Settings</h4>
                    <div className="settings-grid">
                      <div className="setting-row">
                        <span className="setting-label">Game:</span>
                        <span className="setting-value">{canonicalSettings.game}</span>
                      </div>
                      <div className="setting-row">
                        <span className="setting-label">Sensitivity:</span>
                        <span className="setting-value">{canonicalSettings.sensitivity}</span>
                      </div>
                      <div className="setting-row">
                        <span className="setting-label">DPI:</span>
                        <span className="setting-value">{canonicalSettings.dpi}</span>
                      </div>
                    </div>
                  </div>
                ) : suggestedSensitivity ? (
                  <div className="sensitivity-suggestion">
                    <h4>Suggested Sensitivity</h4>
                    <div className="suggestion-details">
                      <p className="suggested-value">{suggestedSensitivity.suggestedSensitivity}</p>
                      <p className="conversion-info">
                        From {suggestedSensitivity.fromGame}: {suggestedSensitivity.fromSensitivity} @ {suggestedSensitivity.fromDPI} DPI
                      </p>
                      <p className="cm360-info">{suggestedSensitivity.cm360} cm/360°</p>
                    </div>
                  </div>
                ) : null}

                <button onClick={handleToggleWidget} className="widget-toggle-btn">
                  Toggle Widget (Ctrl+Shift+W)
                </button>
              </div>
            ) : (
              <div className="no-game">
                <p>No supported game detected</p>
                <p className="help-text">Launch a supported game to see sensitivity conversion options</p>
              </div>
            )}
          </div>
        </section>

        <section className="debug-section">
          <h3>Development Console</h3>
          <OverwolfTerminal />
        </section>
      </main>
    </div>
  );
};