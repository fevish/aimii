import React, { useEffect, useState } from 'react';
import './Widget.css';

// Import the interface from the service
import { CurrentGameInfo } from '../../browser/services/current-game.service';
import { SensitivityConversion } from '../../browser/services/sensitivity-converter.service';
import { BaselineSettings, HotkeyInfo } from '../../types/app';
import { formatSensitivity } from '../../utils/format';

// Local type for electronAPI
type ElectronAPI = {
  openWidgetDevTools: () => void;
  openExternalUrl: (url: string) => Promise<boolean>;
};

const Widget: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentGame, setCurrentGame] = useState<CurrentGameInfo | null>(null);
  const [suggestedSensitivity, setSuggestedSensitivity] = useState<SensitivityConversion | null>(null);
  const [canonicalSettings, setCanonicalSettings] = useState<BaselineSettings | null>(null);
  const [hotkeyInfo, setHotkeyInfo] = useState<HotkeyInfo | null>(null);
  const [cm360, setCm360] = useState<number | null>(null);

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

  const fetchBaselineSettings = async () => {
    try {
      const { ipcRenderer } = require('electron');
      const settings = await ipcRenderer.invoke('widget-get-baseline-settings');

      // Only update if settings have actually changed
      setCanonicalSettings(prevSettings => {
        if (!prevSettings && !settings) return prevSettings;
        if (!prevSettings || !settings) return settings;
        if (prevSettings.mouseTravel === settings.mouseTravel &&
            prevSettings.dpi === settings.dpi) {
          return prevSettings; // No change, keep previous state
        }

        return settings;
      });
    } catch (error) {
      console.error('Failed to fetch baseline settings:', error);
      setCanonicalSettings(null);
    }
  };

  const fetchHotkeyInfo = async () => {
    try {
      const { ipcRenderer } = require('electron');
      const hotkey = await ipcRenderer.invoke('widget-get-hotkey-info');
      setHotkeyInfo(hotkey);
    } catch (error) {
      console.error('[Widget] Failed to fetch hotkey info:', error);
      setHotkeyInfo(null);
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
        if (prevSuggestion.gameName === suggestion.gameName &&
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

  const fetchMouseTravel = async () => {
    try {
      const { ipcRenderer } = require('electron');
      const mouseTravel = await ipcRenderer.invoke('sensitivity-get-current-mouse-travel');
      setCm360(mouseTravel);
    } catch (error) {
      console.error('Failed to fetch mouse travel:', error);
      setCm360(null);
    }
  };

  const fetchData = async () => {
    await Promise.all([
      fetchCurrentGame(),
      fetchBaselineSettings(),
      fetchHotkeyInfo(),
      fetchSuggestedSensitivity(),
      fetchMouseTravel()
    ]);
  };

  // Show suggestions for any supported game when we have baseline settings
  const shouldShowSuggestion = React.useMemo(
    () => currentGame && canonicalSettings && currentGame.isSupported,
    [currentGame, canonicalSettings]
  );

  useEffect(() => {
    // Fetch initial data
    setIsLoading(true);
    fetchData().finally(() => setIsLoading(false));

    // Initialize theme
    const initializeTheme = async () => {
      try {
        const { ipcRenderer } = require('electron');
        const theme = await ipcRenderer.invoke('settings-get-theme');
        applyTheme(theme);
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    initializeTheme();

    // Set up IPC listener for game change events
    const { ipcRenderer } = require('electron');

    const handleGameChanged = () => {
      fetchData(); // Refresh all data when game changes
    };

    // Listen for game change events from main process
    ipcRenderer.on('current-game-changed', handleGameChanged);

    // Listen for baseline settings changes
    const handleBaselineSettingsChanged = (settings: any) => {
      setCanonicalSettings(settings);
    };

    ipcRenderer.on('baseline-settings-changed', handleBaselineSettingsChanged);

    // Listen for theme changes
    const handleThemeChanged = (event: any, theme: string) => {
      applyTheme(theme);
    };

    ipcRenderer.on('theme-changed', handleThemeChanged);

    // Listen for hotkey change events
    const handleHotkeyChanged = (id: string, updatedHotkey: any) => {
      if (id === 'widget-toggle') {
        fetchHotkeyInfo();
      }
    };

    const handleHotkeysReset = () => {
      fetchHotkeyInfo();
    };

    // Listen for hotkey change events from main process
    ipcRenderer.on('hotkey-changed', handleHotkeyChanged);
    ipcRenderer.on('hotkeys-reset', handleHotkeysReset);

    // Add hotkey listeners for dev tools
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey) {
        if (event.key === 'I' || event.key === 'C') {
          event.preventDefault();
          // Send IPC message to open dev tools
          if ((window as any).electronAPI) {
            (window as any).electronAPI.openWidgetDevTools();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      ipcRenderer.removeListener('current-game-changed', handleGameChanged);
      ipcRenderer.removeListener('baseline-settings-changed', handleBaselineSettingsChanged);
      ipcRenderer.removeListener('theme-changed', handleThemeChanged);
      ipcRenderer.removeListener('hotkey-changed', handleHotkeyChanged);
      ipcRenderer.removeListener('hotkeys-reset', handleHotkeysReset);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Theme application function
  const applyTheme = (theme: string) => {
    const { applyTheme: setTheme } = require('../../utils/theme');
    setTheme(theme);
  };

  return (
    <div className="widget-container">
      <div className="widget-header">
        <div className="hotkey-info">
          <p><b>Show/Hide:</b> {hotkeyInfo ? hotkeyInfo.displayText : 'Loading...'}</p>
        </div>
        <button
          className="window-control-btn close-btn"
          title="Close Widget"
          onClick={() => {
            const { ipcRenderer } = require('electron');
            ipcRenderer.invoke('toggleWidget');
          }}
        >
          ✕
        </button>
      </div>
      <div className="widget-content">
        {isLoading
          ? (
            <p className="game-status loading">Loading...</p>
          )
          : (
            <div className="current-game-info">
              <div className="game-display">
                <p>Game Detected: <b className="game-name">{currentGame?.name}</b></p>
              </div>
              {suggestedSensitivity
                ? (
                  <div className="sensitivity-suggestion">
                    <p>Converted Sensitivity</p>
                    <p className="suggested-value">{formatSensitivity(suggestedSensitivity.suggestedSensitivity)}</p>
                    {cm360 && <p className="cm360-info">{cm360.toFixed(2)} cm/360°</p>}
                  </div>
                )
                : !canonicalSettings
                  ? (
                    <div className="sensitivity-suggestion">
                      <p>No baseline configured</p>
                    </div>
                  )
                  : (
                    <div className="sensitivity-suggestion">
                      <p>Using baseline settings</p>
                      {cm360 && <p className="cm360-info">{cm360.toFixed(2)} cm/360°</p>}
                    </div>
                  )
              }
            </div>
          )}
      </div>
    </div>
  );
};

export default Widget;
