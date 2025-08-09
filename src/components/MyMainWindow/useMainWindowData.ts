import React from 'react';
import { CurrentGameInfo } from '../../browser/services/current-game.service';
import { SensitivityConversion } from '../../browser/services/sensitivity-converter.service';
import { GameData, BaselineSettings, HotkeyInfo } from '../../types/app';

export function useMainWindowData() {
  const [games, setGames] = React.useState<GameData[]>([]);
  const [canonicalSettings, setCanonicalSettings] = React.useState<BaselineSettings | null>(null);
  const [currentGame, setCurrentGame] = React.useState<CurrentGameInfo | null>(null);
  const [allDetectedGames, setAllDetectedGames] = React.useState<CurrentGameInfo[]>([]);
  const [suggestedSensitivity, setSuggestedSensitivity] = React.useState<SensitivityConversion | null>(null);
  const [hotkeyInfo, setHotkeyInfo] = React.useState<HotkeyInfo | null>(null);
  const [mouseTravel, setMouseTravel] = React.useState<number | null>(null);
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
        window.games?.getEnabledGames() || Promise.resolve([]),
        (window.settings as any).getBaselineSettings(),
        window.currentGame.getCurrentGameInfo(),
        window.currentGame.getAllDetectedGames(),
        window.widget?.getHotkeyInfo() || Promise.resolve(null),
        (window.settings as any).hasBaselineSettings()
      ]);

      setGames(gamesData);
      setCanonicalSettings(settings);
      setCurrentGame(gameInfo);
      setAllDetectedGames(allGames);
      setHotkeyInfo(hotkey);
      setShowOnboarding(!hasSettings);

      // Get current mouse travel
      if (settings) {
        setMouseTravel(settings.mouseTravel);
      } else {
        const currentMouseTravel = await window.sensitivityConverter.getCurrentMouseTravel();
        setMouseTravel(currentMouseTravel);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }, []);

  const loadGameSpecificData = React.useCallback(async () => {
    try {
      const suggestion = await window.sensitivityConverter.getSuggestedForCurrentGame();
      setSuggestedSensitivity(prevSuggestion => {
        if (!prevSuggestion && !suggestion) return prevSuggestion;
        if (!prevSuggestion || !suggestion) return suggestion;
        if (prevSuggestion.toGame === suggestion.toGame &&
          prevSuggestion.suggestedSensitivity === suggestion.suggestedSensitivity) {
          return prevSuggestion; // No change
        }

        return suggestion;
      });
    } catch (error) {
      console.error('Error loading game-specific data:', error);
    }
  }, []);

  React.useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  React.useEffect(() => {
    loadGameSpecificData();
  }, [currentGame, canonicalSettings, loadGameSpecificData]);

  React.useEffect(() => {
    const handleGameChanged = (gameInfo: CurrentGameInfo) => {
      setCurrentGame(prevGame => {
        if (!prevGame && !gameInfo) return prevGame;
        if (!prevGame || !gameInfo) return gameInfo;
        if (prevGame.id === gameInfo.id && prevGame.name === gameInfo.name) {
          return prevGame; // No change
        }

        return gameInfo;
      });
    };

    const handleBaselineSettingsChanged = () => {
      loadAllData();
    };

    try {
      window.currentGame.onGameChanged(handleGameChanged);
      window.ipcRenderer?.on('baseline-settings-changed', handleBaselineSettingsChanged);
    } catch (error) {
      console.error('Error setting up event listeners:', error);
    }

    return () => {
      try {
        window.currentGame?.removeGameChangedListener?.();
        window.ipcRenderer?.removeAllListeners('baseline-settings-changed');
      } catch (error) {
        console.error('Error removing event listeners:', error);
      }
    };
  }, [loadAllData]);

  // Periodic data refresh for settings changes
  React.useEffect(() => {
    const intervalId = setInterval(() => {
      loadAllDetectedGames();
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [loadAllDetectedGames]);

  return {
    games,
    canonicalSettings,
    currentGame,
    allDetectedGames,
    suggestedSensitivity,
    hotkeyInfo,
    mouseTravel,
    showOnboarding,
    setShowOnboarding,
    setCanonicalSettings,
    setSuggestedSensitivity,
    loadAllDetectedGames,
    loadAllData,
    loadGameSpecificData
  };
}
