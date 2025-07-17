import React, { useState, useEffect } from 'react';
import { OverwolfTerminal } from '../OverwolfTerminal/OverwolfTerminal';
import Settings from '../Settings/Settings';
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

interface HotkeyInfo {
  keyCode: number;
  modifiers: { ctrl: boolean; shift: boolean; alt: boolean };
  displayText: string;
}

interface HotkeyConfig {
  id: string;
  keyCode: number;
  modifiers: { ctrl: boolean; shift: boolean; alt: boolean };
  displayText: string;
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
      getTheme: () => Promise<string>;
      setTheme: (theme: string) => Promise<boolean>;
      onThemeChanged: (callback: (theme: string) => void) => void;
      removeThemeListener: () => void;
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
      getHotkeyInfo: () => Promise<HotkeyInfo>;
    };
    sensitivityConverter: {
      getSuggestedForCurrentGame: () => Promise<SensitivityConversion | null>;
      getAllConversions: () => Promise<SensitivityConversion[]>;
      convert: (fromGame: string, toGame: string, sensitivity: number, dpi: number) => Promise<SensitivityConversion | null>;
    };
    windowControls: {
      minimize: () => void;
      close: () => void;
    };
    electronAPI?: {
      openExternalUrl: (url: string) => Promise<boolean>;
    };
  }
}

export const MyMainWindow: React.FC = () => {
  const [games, setGames] = useState<GameData[]>([]);
  const [canonicalSettings, setCanonicalSettings] = useState<CanonicalSettings | null>(null);
  const [currentGame, setCurrentGame] = useState<CurrentGameInfo | null>(null);
  const [suggestedSensitivity, setSuggestedSensitivity] = useState<SensitivityConversion | null>(null);
  const [hotkeyInfo, setHotkeyInfo] = useState<HotkeyInfo | null>(null);
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [sensitivity, setSensitivity] = useState<string>('');
  const [dpi, setDpi] = useState<string>('800');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main');

  const handleMinimize = () => {
    window.windowControls.minimize();
  };

  const handleClose = () => {
    window.windowControls.close();
  };

  // Memoized values to prevent unnecessary recalculations
  const isPlayingCanonicalGame = React.useMemo(() =>
    currentGame && canonicalSettings &&
    currentGame.name === canonicalSettings.game && currentGame.isSupported,
    [currentGame, canonicalSettings]
  );

  // Consolidated data loading function
  const loadAllData = React.useCallback(async () => {
    try {
      // Load all data in parallel for better performance
      const [gamesData, settings, gameInfo, hotkey] = await Promise.all([
        window.games.getAllGames(),
        window.settings.getCanonicalSettings(),
        window.currentGame.getCurrentGameInfo(),
        window.widget.getHotkeyInfo()
      ]);

      setGames(gamesData);
      setCanonicalSettings(settings);
      setHotkeyInfo(hotkey);

      // Only update current game if it actually changed
      setCurrentGame(prevGame => {
        if (!prevGame && !gameInfo) return prevGame;
        if (!prevGame || !gameInfo) return gameInfo;
        if (prevGame.id === gameInfo.id && prevGame.name === gameInfo.name && prevGame.isSupported === gameInfo.isSupported) {
          return prevGame; // No change, keep previous state
        }
        return gameInfo;
      });

      // Load sensitivity suggestion only if we have both settings and game info
      if (settings && gameInfo && window.sensitivityConverter) {
        const suggestion = await window.sensitivityConverter.getSuggestedForCurrentGame();
        setSuggestedSensitivity(suggestion);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  useEffect(() => {
    // Initial data load
    loadAllData();

    // Initialize theme
    const initializeTheme = async () => {
      try {
        const theme = await window.settings.getTheme();
        applyTheme(theme);
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    initializeTheme();

    // Set up theme change listener
    const handleThemeChanged = (theme: string) => {
      applyTheme(theme);
    };

    if (window.settings && window.settings.onThemeChanged) {
      window.settings.onThemeChanged(handleThemeChanged);
    }

    // Set up listener for game change events
    const handleGameChanged = (gameInfo: any) => {
      console.log('Game changed event received in main window:', gameInfo);
      // Only reload game-specific data, not everything
      loadGameSpecificData(gameInfo);
    };

    if (window.currentGame && window.currentGame.onGameChanged) {
      window.currentGame.onGameChanged(handleGameChanged);
    }

    // Set up listener for hotkey changes
    const handleHotkeyChanged = async (id: string, updates: any) => {
      console.log('Hotkey changed event received:', id, updates);
      if (id === 'widget-toggle') {
        // Refresh hotkey info when widget toggle hotkey changes
        try {
          const hotkey = await window.widget.getHotkeyInfo();
          setHotkeyInfo(hotkey);
        } catch (error) {
          console.error('Error refreshing hotkey info:', error);
        }
      }
    };

    const handleHotkeysReset = async () => {
      console.log('Hotkeys reset event received');
      // Refresh hotkey info when hotkeys are reset
      try {
        const hotkey = await window.widget.getHotkeyInfo();
        setHotkeyInfo(hotkey);
      } catch (error) {
        console.error('Error refreshing hotkey info after reset:', error);
      }
    };

    // Add hotkey change listeners using preload script APIs
    if (window.hotkeys) {
      window.hotkeys.onHotkeyChanged(handleHotkeyChanged);
      window.hotkeys.onHotkeysReset(handleHotkeysReset);
    }

    // Reduced polling frequency for settings changes
    const settingsInterval = setInterval(async () => {
      try {
        const settings = await window.settings.getCanonicalSettings();
        setCanonicalSettings(prev => {
          if (!prev || !settings) return settings;
          if (prev.game === settings.game && prev.sensitivity === settings.sensitivity && prev.dpi === settings.dpi) {
            return prev; // No change
          }
          return settings;
        });
      } catch (error) {
        console.error('Error checking settings:', error);
      }
    }, 30000); // Check every 30 seconds instead of 15

    return () => {
      if (window.currentGame && window.currentGame.removeGameChangedListener) {
        window.currentGame.removeGameChangedListener();
      }
      if (window.settings && window.settings.removeThemeListener) {
        window.settings.removeThemeListener();
      }
      clearInterval(settingsInterval);

      // Remove hotkey change listeners
      if (window.hotkeys) {
        window.hotkeys.removeHotkeyListeners();
      }
    };
  }, [loadAllData]);

  // Separate function for game-specific data updates
  const loadGameSpecificData = React.useCallback(async (gameInfo?: any) => {
    try {
      const currentGameInfo = gameInfo || await window.currentGame.getCurrentGameInfo();

      setCurrentGame(prevGame => {
        if (!prevGame && !currentGameInfo) return prevGame;
        if (!prevGame || !currentGameInfo) return currentGameInfo;
        if (prevGame.id === currentGameInfo.id && prevGame.name === currentGameInfo.name && prevGame.isSupported === currentGameInfo.isSupported) {
          return prevGame; // No change
        }
        return currentGameInfo;
      });

      // Update sensitivity suggestion if we have canonical settings
      if (canonicalSettings && currentGameInfo && window.sensitivityConverter) {
        const suggestion = await window.sensitivityConverter.getSuggestedForCurrentGame();
        setSuggestedSensitivity(prevSuggestion => {
          if (!prevSuggestion && !suggestion) return prevSuggestion;
          if (!prevSuggestion || !suggestion) return suggestion;
          if (prevSuggestion.fromGame === suggestion.fromGame &&
              prevSuggestion.toGame === suggestion.toGame &&
              prevSuggestion.suggestedSensitivity === suggestion.suggestedSensitivity) {
            return prevSuggestion; // No change
          }
          return suggestion;
        });
      }
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  }, [canonicalSettings]);

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
      loadGameSpecificData();
    } catch (error) {
      console.error('Error saving canonical settings:', error);
      setMessage('Error saving settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Theme application function
  const applyTheme = (theme: string) => {
    const htmlElement = document.documentElement;

    // Remove all theme classes
    htmlElement.classList.remove('default', 'neon');

    // Add the selected theme class
    if (theme !== 'default') {
      htmlElement.classList.add(theme);
    }
  };

  return (
    <div className="my-main-window">
      <header className="app-header">
        <h1>AIMII</h1>
        <div className="header-controls">
          <nav className="tab-navigation">
            <button
              className={`tab-button ${activeTab === 'main' ? 'active' : ''}`}
              onClick={() => setActiveTab('main')}
            >
              Main
            </button>
            <button
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              Settings
            </button>
            <button className="tab-button btn-icon discord-btn" onClick={() => window.electronAPI?.openExternalUrl('https://discord.gg/Nj2Xj3W4eY')}>Discord</button>
          </nav>
          <div className="window-controls">
            <button onClick={handleMinimize} className="window-control-btn minimize-btn">_</button>
            <button onClick={handleClose} className="window-control-btn close-btn">✕</button>
          </div>
        </div>
      </header>

      <main className="app-content">
        {activeTab === 'main' ? (
          <>
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

                    {isPlayingCanonicalGame && canonicalSettings ? (
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
                      Toggle Widget {hotkeyInfo ? `(${hotkeyInfo.displayText})` : '(Loading...)'}
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
          </>
        ) : (
          <Settings />
        )}
      </main>
    </div>
  );
};