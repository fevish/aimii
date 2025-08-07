import React from 'react';
import { CurrentGameInfo } from '../../browser/services/current-game.service';
import { SensitivityConversion } from '../../browser/services/sensitivity-converter.service';
import { GameData, CanonicalSettings, HotkeyInfo } from '../../types/app';


export function useMainWindowData() {
  const [games, setGames] = React.useState<GameData[]>([]);
  const [canonicalSettings, setCanonicalSettings] = React.useState<CanonicalSettings | null>(null);
  const [currentGame, setCurrentGame] = React.useState<CurrentGameInfo | null>(null);
  const [allDetectedGames, setAllDetectedGames] = React.useState<CurrentGameInfo[]>([]);
  const [suggestedSensitivity, setSuggestedSensitivity] = React.useState<SensitivityConversion | null>(null);
  const [hotkeyInfo, setHotkeyInfo] = React.useState<HotkeyInfo | null>(null);
  const [cm360, setCm360] = React.useState<number | null>(null);
  const [showOnboarding, setShowOnboarding] = React.useState<boolean>(false);

  const loadAllDetectedGames = React.useCallback(async () => {
    try {
      const allGames = await window.currentGame.getAllDetectedGames();
      setAllDetectedGames(prev => {
        if (
          prev.length !== allGames.length ||
          JSON.stringify(prev.map(g => g.id).sort()) !==
            JSON.stringify(allGames.map(g => g.id).sort())
        ) {
          return allGames;
        }

        return prev;
      });
    } catch (error) {
      console.error('Error loading all detected games:', error);
    }
  }, []);

  const loadAllData = React.useCallback(async () => {
    try {
      const [gamesData, settings, gameInfo, allGames, hotkey, hasSettings] = await Promise.all([
        window.games.getEnabledGames(),
        window.settings.getCanonicalSettings(),
        window.currentGame.getCurrentGameInfo(),
        window.currentGame.getAllDetectedGames(),
        window.widget.getHotkeyInfo(),
        window.settings.hasCanonicalSettings()
      ]);

      setGames(gamesData);

      if (settings && typeof settings === 'object' && 'sensitivity' in settings && 'dpi' in settings && !('edpi' in settings)) {
        (settings as any).edpi = (settings as any).sensitivity * (settings as any).dpi;
      }

      setCanonicalSettings(settings as CanonicalSettings);
      setHotkeyInfo(hotkey);
      setAllDetectedGames(allGames);

      if (!hasSettings) {
        setShowOnboarding(true);
      }

      setCurrentGame(prevGame => {
        if (!prevGame && !gameInfo) return prevGame;
        if (!prevGame || !gameInfo) return gameInfo;
        if (prevGame.id === gameInfo.id && prevGame.name === gameInfo.name && prevGame.isSupported === gameInfo.isSupported) {
          return prevGame;
        }

        return gameInfo;
      });

      if (settings && gameInfo && window.sensitivityConverter) {
        const suggestion = await window.sensitivityConverter.getSuggestedForCurrentGame();
        setSuggestedSensitivity(suggestion);
      }

      if (settings && window.sensitivityConverter) {
        const cm = await window.sensitivityConverter.getCanonicalCm360();
        setCm360(cm);
      } else {
        setCm360(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  React.useEffect(() => {
    loadAllData();

    const initializeTheme = async () => {
      try {
        const theme = await window.settings.getTheme();
        const { applyTheme } = await import('../../utils/theme');
        applyTheme(theme);
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };

    initializeTheme();

    const handleThemeChanged = (theme: string) => {
      const { applyTheme } = require('../../utils/theme');
      applyTheme(theme);
    };

    window.settings?.onThemeChanged?.(handleThemeChanged);

    const handleGameChanged = (gameInfo: any) => {
      loadGameSpecificData(gameInfo);
      loadAllDetectedGames();
    };

    window.currentGame?.onGameChanged?.(handleGameChanged);

    const handleHotkeyChanged = async (id: string) => {
      if (id === 'widget-toggle') {
        try {
          const hotkey = await window.widget.getHotkeyInfo();
          setHotkeyInfo(hotkey);
        } catch (error) {
          console.error('Error refreshing hotkey info:', error);
        }
      }
    };

    const handleHotkeysReset = async () => {
      try {
        const hotkey = await window.widget.getHotkeyInfo();
        setHotkeyInfo(hotkey);
      } catch (error) {
        console.error('Error refreshing hotkey info after reset:', error);
      }
    };

    window.hotkeys?.onHotkeyChanged?.(handleHotkeyChanged);
    window.hotkeys?.onHotkeysReset?.(handleHotkeysReset);

    const settingsInterval = setInterval(async () => {
      try {
        const settings = await window.settings.getCanonicalSettings();
        setCanonicalSettings(prev => {
          if (!prev || !settings) return settings as CanonicalSettings;
          if (prev.game === settings.game && prev.sensitivity === settings.sensitivity && prev.dpi === settings.dpi) {
            return prev;
          }

          if (settings && typeof settings === 'object' && 'sensitivity' in settings && 'dpi' in settings && !('edpi' in settings)) {
            (settings as any).edpi = (settings as any).sensitivity * (settings as any).dpi;
          }

          return settings as CanonicalSettings;
        });
      } catch (error) {
        console.error('Error checking settings:', error);
      }
    }, 30000);

    return () => {
      window.currentGame?.removeGameChangedListener?.();
      window.settings?.removeThemeListener?.();
      clearInterval(settingsInterval);
      window.hotkeys?.removeHotkeyListeners?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGameSpecificData = React.useCallback(async (gameInfo?: any) => {
    try {
      const currentGameInfo = gameInfo || await window.currentGame.getCurrentGameInfo();
      setCurrentGame(prevGame => {
        if (!prevGame && !currentGameInfo) return prevGame;
        if (!prevGame || !currentGameInfo) return currentGameInfo;
        if (
          prevGame.id === currentGameInfo.id &&
          prevGame.name === currentGameInfo.name &&
          prevGame.isSupported === currentGameInfo.isSupported
        ) {
          return prevGame;
        }

        return currentGameInfo;
      });

      if (canonicalSettings && currentGameInfo && window.sensitivityConverter) {
        const suggestion = await window.sensitivityConverter.getSuggestedForCurrentGame();
        setSuggestedSensitivity(prevSuggestion => {
          if (!prevSuggestion && !suggestion) return prevSuggestion;
          if (!prevSuggestion || !suggestion) return suggestion;
          if (prevSuggestion.fromGame === suggestion.fromGame &&
              prevSuggestion.toGame === suggestion.toGame &&
              prevSuggestion.suggestedSensitivity === suggestion.suggestedSensitivity) {
            return prevSuggestion;
          }

          return suggestion;
        });
      }
    } catch (error) {
      console.error('Error loading game data:', error);
    }
  }, [canonicalSettings]);

  return {
    games,
    canonicalSettings,
    currentGame,
    allDetectedGames,
    suggestedSensitivity,
    hotkeyInfo,
    cm360,
    showOnboarding,
    setShowOnboarding,
    setCanonicalSettings,
    setSuggestedSensitivity,
    loadAllDetectedGames,
    loadAllData,
    loadGameSpecificData
  } as const;
}
