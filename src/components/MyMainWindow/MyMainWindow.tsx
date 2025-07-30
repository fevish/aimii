import React, { useState, useEffect } from 'react';

import Settings from '../Settings/Settings';
import { SvgIcon } from '../SvgIcon/SvgIcon';
import './MyMainWindow.css';
import { CurrentGameInfo } from '../../browser/services/current-game.service';
import { SensitivityConversion } from '../../browser/services/sensitivity-converter.service';

interface GameData {
  game: string;
  sensitivityScalingFactor: number;
  owGameId: string;
  owConstant?: string;
  owGameName?: string;
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
  namespace NodeJS {
    interface ProcessEnv {
      APP_VERSION: string;
    }
  }
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
      clearCanonicalSettings: () => Promise<boolean>;
      hasCanonicalSettings: () => Promise<boolean>;
      getTheme: () => Promise<string>;
      setTheme: (theme: string) => Promise<boolean>;
      onThemeChanged: (callback: (theme: string) => void) => void;
      removeThemeListener: () => void;
    };
    currentGame: {
      getCurrentGameInfo: () => Promise<CurrentGameInfo | null>;
      getAllDetectedGames: () => Promise<CurrentGameInfo[]>;
      setCurrentGame: (gameId: number) => Promise<boolean>;
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
  const [allDetectedGames, setAllDetectedGames] = useState<CurrentGameInfo[]>([]);
  const [suggestedSensitivity, setSuggestedSensitivity] = useState<SensitivityConversion | null>(null);
  const [hotkeyInfo, setHotkeyInfo] = useState<HotkeyInfo | null>(null);
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [sensitivity, setSensitivity] = useState<string>('');
  const [dpi, setDpi] = useState<string>('800');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main');
  const [currentGameIndex, setCurrentGameIndex] = useState<number>(0);

  const handleMinimize = () => {
    window.windowControls.minimize();
  };

  const handleClose = () => {
    window.windowControls.close();
  };

  const handlePreviousGame = () => {
    if (allDetectedGames.length > 1) {
      const newIndex = currentGameIndex === 0 ? allDetectedGames.length - 1 : currentGameIndex - 1;
      setCurrentGameIndex(newIndex);
      const game = allDetectedGames[newIndex];
      window.currentGame.setCurrentGame(game.id);
    }
  };

  const handleNextGame = () => {
    if (allDetectedGames.length > 1) {
      const newIndex = currentGameIndex === allDetectedGames.length - 1 ? 0 : currentGameIndex + 1;
      setCurrentGameIndex(newIndex);
      const game = allDetectedGames[newIndex];
      window.currentGame.setCurrentGame(game.id);
    }
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
      const [gamesData, settings, gameInfo, allGames, hotkey] = await Promise.all([
        window.games.getEnabledGames(), // Changed from getAllGames() to getEnabledGames()
        window.settings.getCanonicalSettings(),
        window.currentGame.getCurrentGameInfo(),
        window.currentGame.getAllDetectedGames(),
        window.widget.getHotkeyInfo()
      ]);

      setGames(gamesData);
      setCanonicalSettings(settings);
      setHotkeyInfo(hotkey);
      setAllDetectedGames(allGames);

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
      // Reload both current game and all detected games
      loadGameSpecificData(gameInfo);
      loadAllDetectedGames();
    };

    if (window.currentGame && window.currentGame.onGameChanged) {
      window.currentGame.onGameChanged(handleGameChanged);
    }

    // Set up listener for hotkey changes
    const handleHotkeyChanged = async (id: string, updates: any) => {
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

  // Separate function to load all detected games
  const loadAllDetectedGames = React.useCallback(async () => {
    try {
      const allGames = await window.currentGame.getAllDetectedGames();

      // Only update state if games actually changed
      setAllDetectedGames(prevGames => {
        if (hasGamesChanged(prevGames, allGames)) {
          return allGames;
        }
        return prevGames;
      });
    } catch (error) {
      console.error('Error loading all detected games:', error);
    }
  }, []);

  // Helper function to check if games array has changed
  const hasGamesChanged = (prevGames: CurrentGameInfo[], newGames: CurrentGameInfo[]): boolean => {
    if (prevGames.length !== newGames.length) return true;

    const prevIds = prevGames.map(g => g.id).sort();
    const newIds = newGames.map(g => g.id).sort();
    return JSON.stringify(prevIds) !== JSON.stringify(newIds);
  };

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

  // Separate function to update sensitivity suggestion when settings change
  const updateSensitivitySuggestion = React.useCallback(async () => {
    try {
      if (canonicalSettings && currentGame && window.sensitivityConverter) {
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
      console.error('Error updating sensitivity suggestion:', error);
    }
  }, [canonicalSettings, currentGame]);

  // Watch for canonical settings changes and update sensitivity suggestion
  useEffect(() => {
    if (canonicalSettings && currentGame) {
      updateSensitivitySuggestion();
    }
  }, [canonicalSettings, currentGame, updateSensitivitySuggestion]);

  // Update currentGameIndex when currentGame changes
  useEffect(() => {
    if (currentGame && allDetectedGames.length > 0) {
      const index = allDetectedGames.findIndex(game => game.id === currentGame.id);
      if (index !== -1) {
        setCurrentGameIndex(index);
      }
    }
  }, [currentGame, allDetectedGames]);

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
    } catch (error) {
      console.error('Error saving canonical settings:', error);
      setMessage('Error saving settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetCanonicalSettings = async () => {
    if (!canonicalSettings) {
      setMessage('No settings to reset');
      return;
    }

    setIsLoading(true);
    try {
      // Clear the canonical settings
      await window.settings.clearCanonicalSettings();

      // Update state
      setCanonicalSettings(null);
      setSelectedGame('');
      setSensitivity('');
      setDpi('800');

      // Clear the sensitivity suggestion since there's no baseline to convert from
      setSuggestedSensitivity(null);

      setMessage('Canonical settings cleared successfully!');
    } catch (error) {
      console.error('Error clearing canonical settings:', error);
      setMessage('Error clearing settings');
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
        <div className="app-logo">
          <h1>aimii</h1>
          <span className="version">v{process.env.APP_VERSION}</span>
        </div>
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
            <section>
              {canonicalSettings && (
                <div>
                  <h2>Your saved sensitivity</h2>
                  <p>These settings will be used as your canonical sensitivity for conversions.
                    <br />
                    Now, when you launch a different game, aimii will use these settings to convert your sensitivity to the game you're playing.
                  </p>

                  <div className="canon-settings-container">
                    <div className="canonical-settings">
                      <h3><strong>Game:</strong> {canonicalSettings.game}</h3>
                      <h3><strong>Sensitivity:</strong> {canonicalSettings.sensitivity}</h3>
                      <h3><strong>DPI:</strong> {canonicalSettings.dpi}</h3>
                      <button onClick={handleResetCanonicalSettings} className="reset-button">Change</button>
                    </div>


                    <div className="current-game-section">
                      <div className="current-game-info">
                        {allDetectedGames.length > 1 ? (
                          <div className="multiple-games-detected">
                            {currentGame && (
                              <div className="selected-game-info">
                                <div className="game-navigation">
                                  <div className="game-display">
                                    <p>Games Detected: <b className="game-name">{currentGame?.name}</b></p>
                                  </div>
                                  <div className="multi-games-nav">
                                    <button
                                      className="nav-arrow prev-arrow"
                                      onClick={handlePreviousGame}
                                      disabled={allDetectedGames.length <= 1}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M529-279 361-447q-7-7-10-15.5t-3-17.5q0-9 3-17.5t10-15.5l168-168q5-5 10.5-7.5T551-691q12 0 22 9t10 23v358q0 14-10 23t-22 9q-4 0-22-10Z" /></svg>
                                    </button>
                                    <button
                                      className="nav-arrow next-arrow"
                                      onClick={handleNextGame}
                                      disabled={allDetectedGames.length <= 1}
                                    >
                                      <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M529-279 361-447q-7-7-10-15.5t-3-17.5q0-9 3-17.5t10-15.5l168-168q5-5 10.5-7.5T551-691q12 0 22 9t10 23v358q0 14-10 23t-22 9q-4 0-22-10Z" /></svg>
                                    </button>
                                  </div>
                                </div>
                                <div className="sensitivity-suggestion">
                                  {suggestedSensitivity ? (
                                    <>
                                      <p>
                                        Converted Sensitivity
                                      </p>
                                      <p className="suggested-value">{suggestedSensitivity.suggestedSensitivity}</p>
                                    </>
                                  ) : (
                                    <>
                                      <p>
                                        Sensitivity
                                      </p>
                                      <p className="suggested-value">{canonicalSettings.sensitivity}</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : allDetectedGames.length === 1 && currentGame ? (
                          <div className="game-detected">

                            <div className="game-display">
                              <p>Game Detected: <b>{currentGame?.name}</b></p>
                            </div>
                            {suggestedSensitivity ? (
                              <div className="sensitivity-suggestion">
                                <p>
                                  Converted Sensitivity
                                </p>
                                <p className="suggested-value">{suggestedSensitivity.suggestedSensitivity}</p>
                              </div>
                            ) : (
                              <div className="sensitivity-suggestion">
                                <p>
                                  Sensitivity
                                </p>
                                <p className="suggested-value">{canonicalSettings.sensitivity}</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="no-game">
                            <p>No supported game detected</p>
                            <p className="help-text">Launch a supported game to see sensitivity conversion options</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!canonicalSettings && (
                <div>
                  <h2>Set your sensitivity baseline</h2>
                  <p>To get started, set your preferred game, sensitivity, and DPI as your baseline for conversions.</p>

                  <form onSubmit={handleSaveCanonicalSettings} className="canonical-form">
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="game-select">1. Preferred Game</label>
                        <select
                          id="game-select"
                          value={selectedGame}
                          onChange={(e) => setSelectedGame(e.target.value)}
                          required
                        >
                          <option value="">Select a Game</option>
                          {games.map((game) => (
                            <option key={game.game} value={game.game}>
                              {game.game}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label htmlFor="sensitivity-input">2. In-Game Sensitivity</label>
                        <input
                          id="sensitivity-input"
                          type="number"
                          step="any"
                          min="0.001"
                          value={sensitivity}
                          onChange={(e) => setSensitivity(e.target.value)}
                          placeholder="0.35"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="dpi-input">3.Mouse DPI</label>
                        <input
                          id="dpi-input"
                          type="number"
                          min="1"
                          value={dpi}
                          onChange={(e) => setDpi(e.target.value)}
                          placeholder="800"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-buttons">
                      <button type="submit" disabled={isLoading} className="save-button">
                        {isLoading ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        disabled={isLoading || !canonicalSettings}
                        onClick={handleResetCanonicalSettings}
                        className="reset-button"
                      >
                        {isLoading ? 'Resetting...' : 'Reset'}
                      </button>
                    </div>
                  </form>

                  {message && (
                    <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
                      {message}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="notes-section">
              <h4>Early Access Notes</h4>
              <ul>
                <li>
                  <p>
                    <b>In-game widget will not work in all games.</b>
                    <br />
                    Some of our supported games eg. Counter-Strike 2 do not support in-game overlays.
                  </p>
                </li>
                <li>
                  <p>
                    This app is very early access, features may change or break. Please report bugs to
                    &nbsp;<a onClick={() => window.electronAPI?.openExternalUrl('https://discord.gg/Nj2Xj3W4eY')}>@fevish on our Discord</a>.
                  </p>
                </li>
              </ul>
            </section>

            <section className="debug-section">
              <h3>Development Console</h3>

            </section>
          </>
        ) : (
          <Settings />
        )}
      </main>
    </div >
  );
};