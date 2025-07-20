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

interface HotkeyInfo {
  keyCode: number;
  modifiers: { ctrl: boolean; shift: boolean; alt: boolean };
  displayText: string;
}

// Local type for electronAPI
type ElectronAPI = {
  openWidgetDevTools: () => void;
  openExternalUrl: (url: string) => Promise<boolean>;
};

const Widget: React.FC = () => {
  const [currentGame, setCurrentGame] = useState<CurrentGameInfo | null>(null);
  const [suggestedSensitivity, setSuggestedSensitivity] = useState<SensitivityConversion | null>(null);
  const [canonicalSettings, setCanonicalSettings] = useState<CanonicalSettings | null>(null);
  const [hotkeyInfo, setHotkeyInfo] = useState<HotkeyInfo | null>(null);
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

  const fetchHotkeyInfo = async () => {
    try {
      const { ipcRenderer } = require('electron');
      console.log('[Widget] Fetching hotkey info...');
      const hotkey = await ipcRenderer.invoke('widget-get-hotkey-info');
      console.log('[Widget] Received hotkey info:', hotkey);
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
    await Promise.all([fetchCurrentGame(), fetchCanonicalSettings(), fetchHotkeyInfo(), fetchSuggestedSensitivity()]);
  };

  // Check if current game matches canonical game
  const isPlayingCanonicalGame = React.useMemo(() =>
    currentGame && canonicalSettings &&
    currentGame.name === canonicalSettings.game && currentGame.isSupported,
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
      console.log('Game changed event received in widget');
      fetchData(); // Refresh all data when game changes
    };

    // Listen for game change events from main process
    ipcRenderer.on('current-game-changed', handleGameChanged);

    // Listen for canonical settings changes
    const handleCanonicalSettingsChanged = (settings: any) => {
      console.log('[Widget] Canonical settings changed event received:', settings);

      // Refresh all data when canonical settings change
      // This ensures the widget updates properly when the canonical game changes
      fetchData();
    };

    // Listen for canonical settings change events from main process
    ipcRenderer.on('canonical-settings-changed', handleCanonicalSettingsChanged);

    // Listen for theme changes
    const handleThemeChanged = (event: any, theme: string) => {
      console.log('[Widget] Theme changed event received:', theme);
      applyTheme(theme);
    };

    // Listen for theme change events from main process
    ipcRenderer.on('theme-changed', handleThemeChanged);

    // Listen for hotkey change events
    const handleHotkeyChanged = (id: string, updatedHotkey: any) => {
      console.log('[Widget] Hotkey changed event received:', id, updatedHotkey);
      if (id === 'widget-toggle') {
        console.log('[Widget] Widget hotkey changed, refreshing display...');
        fetchHotkeyInfo(); // Refresh hotkey info when widget hotkey changes
      }
    };

    const handleHotkeysReset = () => {
      console.log('[Widget] Hotkeys reset event received');
      console.log('[Widget] Refreshing hotkey display...');
      fetchHotkeyInfo(); // Refresh hotkey info when hotkeys are reset
    };

    // Listen for hotkey change events from main process
    ipcRenderer.on('hotkey-changed', handleHotkeyChanged);
    ipcRenderer.on('hotkeys-reset', handleHotkeysReset);

    // Fallback: reduced frequency polling for canonical settings changes
    // (since settings changes don't have events)
    const settingsInterval = setInterval(fetchCanonicalSettings, 10000); // Check settings every 10 seconds

    // Fallback: poll for hotkey changes every 5 seconds (in case events don't work)
    const hotkeyInterval = setInterval(fetchHotkeyInfo, 5000); // Check hotkey every 5 seconds

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
      ipcRenderer.removeListener('canonical-settings-changed', handleCanonicalSettingsChanged);
      ipcRenderer.removeListener('theme-changed', handleThemeChanged);
      ipcRenderer.removeListener('hotkey-changed', handleHotkeyChanged);
      ipcRenderer.removeListener('hotkeys-reset', handleHotkeysReset);
      clearInterval(settingsInterval);
      clearInterval(hotkeyInterval);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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
        {isLoading ? (
          <p className="game-status loading">Loading...</p>
        ) : (
          <div className="current-game-info">
            <div className="game-display">
              <p>Game Detected: <b className="game-name">{currentGame?.name}</b></p>
            </div>
            {isPlayingCanonicalGame ? (
              <div className="sensitivity-suggestion">
                <p>Sensitivity</p>
                <p className="suggested-value">{canonicalSettings?.sensitivity}</p>
              </div>
            ) : suggestedSensitivity ? (
              <div className="sensitivity-suggestion">
                <p>Converted Sensitivity</p>
                <p className="suggested-value">{suggestedSensitivity.suggestedSensitivity}</p>
              </div>
            ) : !canonicalSettings ? (
              <div className="sensitivity-suggestion">
                <p>No canon game selected</p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

export default Widget;