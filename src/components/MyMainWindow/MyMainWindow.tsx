import React, { useState, useEffect } from 'react';

import Settings from '../Settings/Settings';
import { SvgIcon } from '../SvgIcon/SvgIcon';
import { Onboarding } from '../Onboarding';
import { CardButton } from '../CardButton/CardButton';
import { UserPreferencesContent } from '../CardButton/UserPreferencesContent';
import { SecondaryCardContent } from '../CardButton/SecondaryCardContent';
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
  edpi: number;
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
      getCanonicalCm360: () => Promise<number | null>;
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

  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);
  const [onboardingStep, setOnboardingStep] = useState<number>(1);
  const [onboardingData, setOnboardingData] = useState({
    selectedGame: '',
    sensitivity: '',
    dpi: '',
    edpi: '',
    knowsEdpi: null
  });

  // Card state
  const [isUserPreferencesCardOpen, setIsUserPreferencesCardOpen] = useState<boolean>(false);
  const [isSecondaryCardOpen, setIsSecondaryCardOpen] = useState<boolean>(false);
  const [showUserPreferencesForm, setShowUserPreferencesForm] = useState<boolean>(false);
  const [userPreferencesFormData, setUserPreferencesFormData] = useState({
    selectedGame: '',
    sensitivity: '',
    dpi: ''
  });
  const [userPreferencesSettingsData, setUserPreferencesSettingsData] = useState({
    selectedGame: '',
    sensitivity: '',
    dpi: '',
    edpi: '',
    knowsEdpi: null as boolean | null
  });
  const [userPreferencesSettingsStep, setUserPreferencesSettingsStep] = useState(1);

  // cm/360° state
  const [cm360, setCm360] = useState<number | null>(null);

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
      const [gamesData, settings, gameInfo, allGames, hotkey, hasSettings] = await Promise.all([
        window.games.getEnabledGames(), // Changed from getAllGames() to getEnabledGames()
        window.settings.getCanonicalSettings(),
        window.currentGame.getCurrentGameInfo(),
        window.currentGame.getAllDetectedGames(),
        window.widget.getHotkeyInfo(),
        window.settings.hasCanonicalSettings()
      ]);

      setGames(gamesData);
      // Ensure settings have edpi for compatibility
      if (settings && typeof settings === 'object' && 'sensitivity' in settings && 'dpi' in settings && !('edpi' in settings)) {
        (settings as any).edpi = (settings as any).sensitivity * (settings as any).dpi;
      }
      setCanonicalSettings(settings as CanonicalSettings);
      setHotkeyInfo(hotkey);
      setAllDetectedGames(allGames);

      // Check if user has canonical settings, if not show onboarding
      if (!hasSettings) {
        setShowOnboarding(true);
        setOnboardingStep(1);
        // Reset onboarding data to ensure clean state
        setOnboardingData({ selectedGame: '', sensitivity: '', dpi: '', edpi: '', knowsEdpi: null });
      }

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
          if (!prev || !settings) return settings as CanonicalSettings;
          if (prev.game === settings.game && prev.sensitivity === settings.sensitivity && prev.dpi === settings.dpi) {
            return prev; // No change
          }
          // Ensure settings have edpi for compatibility
          if (settings && typeof settings === 'object' && 'sensitivity' in settings && 'dpi' in settings && !('edpi' in settings)) {
            (settings as any).edpi = (settings as any).sensitivity * (settings as any).dpi;
          }
          return settings as CanonicalSettings;
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

  // Calculate cm/360° when canonical settings change
  useEffect(() => {
    fetchCanonicalCm360();
  }, [canonicalSettings]);

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
      const newSettings = { game: selectedGame, sensitivity: sensitivityNum, dpi: dpiNum, edpi: sensitivityNum * dpiNum };
      setCanonicalSettings(newSettings);
      setMessage('eDPI saved successfully!');
      setTimeout(() => setMessage(''), 3000);
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
    htmlElement.classList.remove('default', 'high-contrast');

    // Add the selected theme class
    if (theme !== 'default') {
      htmlElement.classList.add(theme);
    }
  };

  // Onboarding handlers
  const handleOnboardingNext = () => {
    // If user knows their eDPI and has entered it, complete onboarding
    if (onboardingData.knowsEdpi === true && onboardingData.edpi) {
      handleCompleteOnboarding();
      return;
    }

    // If user doesn't know their eDPI, go through step-by-step process
    if (onboardingData.knowsEdpi === false) {
      if (onboardingStep < 3) {
        setOnboardingStep(onboardingStep + 1);
      } else {
        // Complete onboarding
        handleCompleteOnboarding();
      }
    }
  };

  const handleOnboardingBack = () => {
    if (onboardingStep > 1) {
      setOnboardingStep(onboardingStep - 1);
    } else if (onboardingData.knowsEdpi !== null) {
      // Go back to initial choice screen
      setOnboardingData(prev => ({ ...prev, knowsEdpi: null }));
      setOnboardingStep(1);
    }
  };

  const handleOnboardingDataChange = (field: string, value: string) => {
    setOnboardingData(prev => ({
      ...prev,
      [field]: field === 'knowsEdpi' ? value === 'true' : value
    }));
  };

  const handleOpenUserPreferencesCard = () => {
    setIsUserPreferencesCardOpen(true);
    setShowUserPreferencesForm(false);
    setUserPreferencesFormData({
      selectedGame: canonicalSettings?.game || '',
      sensitivity: canonicalSettings?.sensitivity?.toString() || '',
      dpi: canonicalSettings?.dpi?.toString() || ''
    });
  };

  const handleCloseUserPreferencesCard = () => {
    setIsUserPreferencesCardOpen(false);
    setShowUserPreferencesForm(false);
    setUserPreferencesFormData({ selectedGame: '', sensitivity: '', dpi: '' });
  };

  const handleShowUserPreferencesForm = () => {
    setShowUserPreferencesForm(true);
    // Initialize settings data with current values
    setUserPreferencesSettingsData({
      selectedGame: canonicalSettings?.game || '',
      sensitivity: canonicalSettings?.sensitivity?.toString() || '',
      dpi: canonicalSettings?.dpi?.toString() || '',
      edpi: canonicalSettings?.edpi?.toString() || '',
      knowsEdpi: null
    });
    setUserPreferencesSettingsStep(1);
  };

  const handleCancelUserPreferencesForm = () => {
    setShowUserPreferencesForm(false);
    setUserPreferencesFormData({
      selectedGame: canonicalSettings?.game || '',
      sensitivity: canonicalSettings?.sensitivity?.toString() || '',
      dpi: canonicalSettings?.dpi?.toString() || ''
    });
    // Reset settings flow data
    setUserPreferencesSettingsData({
      selectedGame: canonicalSettings?.game || '',
      sensitivity: canonicalSettings?.sensitivity?.toString() || '',
      dpi: canonicalSettings?.dpi?.toString() || '',
      edpi: canonicalSettings?.edpi?.toString() || '',
      knowsEdpi: null
    });
    setUserPreferencesSettingsStep(1);
  };

  const handleUserPreferencesNext = async () => {
    if (userPreferencesSettingsData.knowsEdpi === true && userPreferencesSettingsData.edpi) {
      // User knows eDPI - save settings
      const edpiNum = parseFloat(userPreferencesSettingsData.edpi);
      if (isNaN(edpiNum) || edpiNum <= 0) {
        setMessage('Please enter a valid eDPI value');
        setTimeout(() => setMessage(''), 3000);
        return;
      }

      // Calculate sensitivity and DPI from eDPI (assuming 800 DPI as default)
      const defaultDpi = 800;
      const calculatedSensitivity = (edpiNum / defaultDpi).toFixed(3);

      const success = await handleSaveSettingsFromCard(
        canonicalSettings?.game || 'Unknown',
        parseFloat(calculatedSensitivity),
        defaultDpi,
        'eDPI Updated'
      );

      if (success) {
        setShowUserPreferencesForm(false);
        setUserPreferencesSettingsStep(1);
      }
    } else if (userPreferencesSettingsData.knowsEdpi === false) {
      if (userPreferencesSettingsStep < 3) {
        setUserPreferencesSettingsStep(userPreferencesSettingsStep + 1);
      } else {
        // Final step - save settings
        if (!userPreferencesSettingsData.selectedGame || !userPreferencesSettingsData.sensitivity || !userPreferencesSettingsData.dpi) {
          setMessage('Please fill in all fields');
          setTimeout(() => setMessage(''), 3000);
          return;
        }

        const success = await handleSaveSettingsFromCard(
          userPreferencesSettingsData.selectedGame,
          parseFloat(userPreferencesSettingsData.sensitivity),
          parseInt(userPreferencesSettingsData.dpi),
          'eDPI Updated'
        );

        if (success) {
          setShowUserPreferencesForm(false);
          setUserPreferencesSettingsStep(1);
        }
      }
    }
  };

  const handleUserPreferencesBack = () => {
    if (userPreferencesSettingsStep > 1) {
      setUserPreferencesSettingsStep(userPreferencesSettingsStep - 1);
    } else if (userPreferencesSettingsData.knowsEdpi !== null) {
      // Go back to initial choice
      setUserPreferencesSettingsData(prev => ({ ...prev, knowsEdpi: null }));
      setUserPreferencesSettingsStep(1);
    }
  };

  const handleOpenSecondaryCard = () => {
    setIsSecondaryCardOpen(true);
  };

  const handleCloseSecondaryCard = () => {
    setIsSecondaryCardOpen(false);
  };

  const fetchCanonicalCm360 = async () => {
    if (canonicalSettings && window.sensitivityConverter) {
      try {
        // CM/360° is universal for a given eDPI - it doesn't change between games
        const cm360Value = await window.sensitivityConverter.getCanonicalCm360();
        setCm360(cm360Value);
      } catch (error) {
        console.error('Error fetching cm/360°:', error);
        setCm360(null);
      }
    } else {
      setCm360(null);
    }
  };

  const handleResetSettingsFromCard = () => {
    setIsUserPreferencesCardOpen(false);
    handleResetCanonicalSettings();
  };

  const handleSaveSettingsFromCard = async (game: string, sensitivity: number, dpi: number, customMessage?: string): Promise<boolean> => {
    try {
      const success = await window.settings.setCanonicalSettings(game, sensitivity, dpi);
      if (success) {
        // Reload data to update the UI
        await loadAllData();
        setShowUserPreferencesForm(false);
        // Show success message in the card content (not in SettingsFlow)
        if (customMessage) {
          setMessage(customMessage);
          setTimeout(() => setMessage(''), 3000);
        }
      } else {
        setMessage('Error saving settings');
        setTimeout(() => setMessage(''), 3000);
      }
      return success;
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage('Error saving settings');
      setTimeout(() => setMessage(''), 3000);
      return false;
    }
  };

  const handleSubmitUserPreferencesForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPreferencesFormData.selectedGame || !userPreferencesFormData.sensitivity || !userPreferencesFormData.dpi) return;

    const success = await handleSaveSettingsFromCard(
      userPreferencesFormData.selectedGame,
      parseFloat(userPreferencesFormData.sensitivity),
      parseInt(userPreferencesFormData.dpi)
    );
  };

  const handleRestartOnboarding = async () => {
    try {
      // Clear all canonical settings
      await window.settings.clearCanonicalSettings();

      // Reset all state
      setCanonicalSettings(null);
      setCm360(null);
      setSuggestedSensitivity(null);
      setOnboardingData({ selectedGame: '', sensitivity: '', dpi: '', edpi: '', knowsEdpi: null });
      setOnboardingStep(1);
      setShowOnboarding(true);

      console.log('Onboarding restarted - all settings cleared');
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    }
  };

  const handleCompleteOnboarding = async () => {
    // Check if user provided eDPI directly
    if (onboardingData.knowsEdpi === true && onboardingData.edpi) {
      const edpiNum = parseFloat(onboardingData.edpi);
      if (isNaN(edpiNum) || edpiNum <= 0) {
        setMessage('Please enter a valid eDPI value');
        return;
      }

      // For direct eDPI input, we need to set a default game and calculate sensitivity/DPI
      const defaultGame = 'Valorant';
      const defaultDpi = 800;
      const calculatedSensitivity = edpiNum / defaultDpi;

      setIsLoading(true);
      try {
        await window.settings.setCanonicalSettings(
          defaultGame,
          calculatedSensitivity,
          defaultDpi
        );

        // Update canonical settings state
        const newSettings = {
          game: defaultGame,
          sensitivity: calculatedSensitivity,
          dpi: defaultDpi,
          edpi: edpiNum
        };
        setCanonicalSettings(newSettings);

        // Hide onboarding and show main screen
        setShowOnboarding(false);
        setOnboardingStep(1);
        setOnboardingData({ selectedGame: '', sensitivity: '', dpi: '', edpi: '', knowsEdpi: null });
        setMessage('eDPI saved successfully!');
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        console.error('Error saving onboarding settings:', error);
        setMessage('Error saving settings');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    // Check if user went through the step-by-step process
    if (!onboardingData.sensitivity || !onboardingData.dpi) {
      setMessage('Please fill in all required fields');
      return;
    }

    const sensitivityNum = parseFloat(onboardingData.sensitivity);
    const dpiNum = parseInt(onboardingData.dpi);

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
      await window.settings.setCanonicalSettings(
        onboardingData.selectedGame || 'Counter-Strike 2',
        sensitivityNum,
        dpiNum
      );

      // Update canonical settings state
      const newSettings = {
        game: onboardingData.selectedGame || 'Counter-Strike 2',
        sensitivity: sensitivityNum,
        dpi: dpiNum,
        edpi: sensitivityNum * dpiNum
      };
      setCanonicalSettings(newSettings);

      // Hide onboarding and show main screen
      setShowOnboarding(false);
      setOnboardingStep(1);
      setOnboardingData({ selectedGame: '', sensitivity: '', dpi: '800', edpi: '', knowsEdpi: null });
      setMessage('eDPI saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving onboarding settings:', error);
      setMessage('Error saving settings');
    } finally {
      setIsLoading(false);
    }
  };

  // Reusable component for game information display
  const GameInfo = ({
    title,
    gameName,
    suggestedSensitivity,
    canonicalSettings,
    cm360,
    showNavigation = false,
    onPrevious,
    onNext,
    canNavigate
  }: {
    title: string;
    gameName?: string;
    suggestedSensitivity: SensitivityConversion | null;
    canonicalSettings: CanonicalSettings | null;
    cm360: number | null;
    showNavigation?: boolean;
    onPrevious?: () => void;
    onNext?: () => void;
    canNavigate?: boolean;
  }) => (
    <>
      <h2>{title}</h2>
      {suggestedSensitivity ? (
        <>
          <p className="cool-text">// Converted Sensitivity</p>
          <h4>{suggestedSensitivity.suggestedSensitivity}</h4>
        </>
      ) : (
        <>
          <p className="cool-text">// Current Sensitivity</p>
          <h4>{canonicalSettings?.sensitivity}</h4>
        </>
      )}

      <div className="settings-grid">
        <div className="setting-row">
          <span className="setting-label">Current Game</span>
          <span className="setting-value">{gameName}</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">
            {suggestedSensitivity ? 'Recommended Sensitivity' : 'Sensitivity'}
          </span>
          <span className="setting-value">
            {suggestedSensitivity ? suggestedSensitivity.suggestedSensitivity : canonicalSettings?.sensitivity}
          </span>
        </div>
        <div className="setting-row">
          <span className="setting-label">DPI</span>
          <span className="setting-value">{canonicalSettings?.dpi}</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">CM/360°</span>
          <span className="setting-value">
            {suggestedSensitivity
              ? `${suggestedSensitivity.cm360} cm`
              : cm360 !== null
                ? `${cm360} cm`
                : 'Calculating...'
            }
          </span>
        </div>
      </div>

      {showNavigation && (
        <div className="multi-games-nav">
          <button
            className="nav-arrow prev-arrow"
            onClick={onPrevious}
            disabled={!canNavigate}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M529-279 361-447q-7-7-10-15.5t-3-17.5q0-9 3-17.5t10-15.5l168-168q5-5 10.5-7.5T551-691q12 0 22 9t10 23v358q0 14-10 23t-22 9q-4 0-22-10Z" /></svg>
          </button>
          <button
            className="nav-arrow next-arrow"
            onClick={onNext}
            disabled={!canNavigate}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M529-279 361-447q-7-7-10-15.5t-3-17.5q0-9 3-17.5t10-15.5l168-168q5-5 10.5-7.5T551-691q12 0 22 9t10 23v358q0 14-10 23t-22 9q-4 0-22-10Z" /></svg>
          </button>
        </div>
      )}
    </>
  );

  return (
    <div className={`my-main-window ${showOnboarding ? 'onboarding' : ''}`}>
      <header className="app-header">
        <div className="app-logo">
          <h1>aimii.app</h1>
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
            <button className="tab-button" onClick={handleRestartOnboarding} title="Restart App and Clear Settings">
              Kill Switch
            </button>
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
            {showOnboarding ? (
              <Onboarding
                games={games}
                onboardingData={onboardingData}
                onboardingStep={onboardingStep}
                isLoading={isLoading}
                message={message}
                onDataChange={handleOnboardingDataChange}
                onNext={handleOnboardingNext}
                onBack={handleOnboardingBack}
                onRestart={handleRestartOnboarding}
              />
            ) : (
              <>
                <section className="main-section">
                  <div className="info-section">
                    {/* Default state - no games detected */}
                    {!currentGame && (
                      <>
                        <h2>Your ready to go!</h2>
                        <p>Launch a game to get started and we'll recommend a sensitivity for you based on your eDPI.</p>


                        <div className="notes-section">
                          <h3>Early Access Notes</h3>
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
                                <b>This app is very early access</b>
                                <br />
                                Features may change or break. Please report bugs to
                                &nbsp;<a onClick={() => window.electronAPI?.openExternalUrl('https://discord.gg/Nj2Xj3W4eY')}>@fevish on our Discord</a>.
                              </p>
                            </li>
                          </ul>
                        </div>
                      </>
                    )}

                    {/* Single game detected */}
                    {currentGame && allDetectedGames.length === 1 && (
                      <GameInfo
                        title="Supported Game Detected"
                        gameName={currentGame.name}
                        suggestedSensitivity={suggestedSensitivity}
                        canonicalSettings={canonicalSettings}
                        cm360={cm360}
                        showNavigation={allDetectedGames.length > 1}
                        onPrevious={handlePreviousGame}
                        onNext={handleNextGame}
                        canNavigate={allDetectedGames.length > 1}
                      />
                    )}

                    {/* Multiple games detected */}
                    {currentGame && allDetectedGames.length > 1 && (
                      <GameInfo
                        title="Multiple Games Detected"
                        gameName={currentGame.name}
                        suggestedSensitivity={suggestedSensitivity}
                        canonicalSettings={canonicalSettings}
                        cm360={cm360}
                        showNavigation={allDetectedGames.length > 1}
                        onPrevious={handlePreviousGame}
                        onNext={handleNextGame}
                        canNavigate={allDetectedGames.length > 1}
                      />
                    )}
                  </div>

                  <div className="cards-section">
                    <CardButton
                      title="eDPI"
                      value={canonicalSettings?.edpi || (canonicalSettings?.sensitivity || 0) * (canonicalSettings?.dpi || 0)}
                      iconName="arrow-north-east"
                      isOpen={isUserPreferencesCardOpen}
                      onToggle={handleOpenUserPreferencesCard}
                      onClose={handleCloseUserPreferencesCard}
                      className="user-preferences"
                      contentTitle="Preferences"
                    >
                      <UserPreferencesContent
                        showForm={showUserPreferencesForm}
                        canonicalSettings={canonicalSettings}
                        cm360={cm360}
                        games={games}
                        settingsData={userPreferencesSettingsData}
                        settingsStep={userPreferencesSettingsStep}
                        isLoading={isLoading}
                        message={message}
                        onDataChange={(field: string, value: string) =>
                          setUserPreferencesSettingsData(prev => ({
                            ...prev,
                            [field]: field === 'knowsEdpi' ? value === 'true' : value
                          }))
                        }
                        onNext={handleUserPreferencesNext}
                        onBack={handleUserPreferencesBack}
                        onShowForm={handleShowUserPreferencesForm}
                        onCancelForm={handleCancelUserPreferencesForm}
                      />
                    </CardButton>

                    <CardButton
                      title="Placeholder"
                      value="WIP"
                      iconName="arrow-north-east"
                      isOpen={isSecondaryCardOpen}
                      // onToggle={handleOpenSecondaryCard}
                      // onClose={handleCloseSecondaryCard}
                      onToggle={() => { }}
                      onClose={() => { }}
                      className="card-secondary"
                    >
                      <SecondaryCardContent />
                    </CardButton>
                  </div>
                </section>

                <section className="ad-section">
                </section>
              </>
            )}
          </>
        ) : (
          <Settings />
        )}
      </main>


    </div >
  );
};