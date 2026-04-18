import React, { useState, useEffect } from 'react';

import Settings from '../Settings/Settings';
import { Onboarding } from '../Onboarding';
// import { Terminal } from '../Terminal/Terminal';
import './MainWindow.css';
import { useMainWindowData } from './useMainWindowData';
import { useAdDetection } from './useAdDetection';
import { HomeView } from './views/HomeView';
import { Header } from './views/Header';
import { applyTheme } from '../../utils/theme';
import { SvgIcon } from '../SvgIcon/SvgIcon';

export const MainWindow: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [sensitivity, setSensitivity] = useState<string>('');
  const [dpi, setDpi] = useState<string>('800');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main');
  const [currentGameIndex, setCurrentGameIndex] = useState<number>(0);
  const [trueSens, setTrueSens] = useState<number | null>(null);

  const {
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
  } = useMainWindowData();

  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [onboardingData, setOnboardingData] = useState({
    selectedGame: '',
    sensitivity: '',
    dpi: '',
    edpi: ''
  });
  const [isEditPreferencesMode, setIsEditPreferencesMode] = useState(false);
  const [shouldOpenPreferencesCard, setShouldOpenPreferencesCard] = useState(false);

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
  const isPlayingCanonicalGame = React.useMemo(
    () => currentGame && canonicalSettings && currentGame.isSupported,
    [currentGame, canonicalSettings]
  );


  // Separate function to update sensitivity suggestion when settings change
  const updateSensitivitySuggestion = React.useCallback(async () => {
    try {
      if (canonicalSettings && currentGame && window.sensitivityConverter) {
        const suggestion = await window.sensitivityConverter.getSuggestedForCurrentGame();
        setSuggestedSensitivity(prevSuggestion => {
          if (!prevSuggestion && !suggestion) return prevSuggestion;
          if (!prevSuggestion || !suggestion) return suggestion;
          if (prevSuggestion.gameName === suggestion.gameName &&
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

  // Return to home view on any game state change (launch or exit)
  useEffect(() => {
    setActiveTab('main');
  }, [currentGame]);

  // Show welcome message when MyMainWindow renders
  React.useEffect(() => {
    console.log(`aimii v${process.env.APP_VERSION} successfully loaded`);
  }, []);

  // Initialize theme on startup
  React.useEffect(() => {
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

    window.settings.onThemeChanged(handleThemeChanged);

    return () => {
      window.settings.removeThemeListener();
    };
  }, []);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const value = await window.sensitivityConverter.getTrueSens();
        if (isMounted) setTrueSens(value);
      } catch (e) {
        if (isMounted) setTrueSens(null);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [canonicalSettings]);


  // Ad detection event listeners
  useAdDetection();

  const handleToggleWidget = async () => {
    try {
      await window.widget.toggleWidget();
    } catch (error) {
      console.error('Error toggling widget:', error);
      setMessage('Error toggling widget');
    }
  };

  /** Full restart: clear settings and show onboarding from welcome (step 0). Used by Settings kill switch. */
  const handleRestartOnboarding = async () => {
    try {
      await (window.settings as any).clearBaselineSettings();
      setCanonicalSettings(null);
      setSuggestedSensitivity(null);
      setOnboardingData({ selectedGame: '', sensitivity: '', dpi: '', edpi: '' });
      setOnboardingStep(0);
      setIsEditPreferencesMode(false);
      setShowOnboarding(true);
      setActiveTab('main');
      console.log('Onboarding restarted - all settings cleared');
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    }
  };

  /** Open onboarding at step 1 (set reference game) to edit preferences. Cancel returns to home with preferences card open. */
  const handleEditPreferences = () => {
    if (canonicalSettings) {
      setOnboardingData({
        selectedGame: canonicalSettings.favoriteGame || '',
        sensitivity: String(canonicalSettings.favoriteSensitivity ?? ''),
        dpi: String(canonicalSettings.dpi ?? ''),
        edpi: String(canonicalSettings.eDPI ?? '')
      });
    }
    setOnboardingStep(1);
    setIsEditPreferencesMode(true);
    setShowOnboarding(true);
    setActiveTab('main');
  };

  // Onboarding handlers
  const handleOnboardingNext = () => {
    if (onboardingStep < 3) {
      setOnboardingStep(prev => prev + 1);
      return;
    }

    // Step 3 -> Complete
    handleCompleteOnboarding();
  };

  const handleOnboardingStepBack = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(prev => prev - 1);
    }
  };

  const handleOnboardingCancel = () => {
    setShowOnboarding(false);
    setIsEditPreferencesMode(false);
    setOnboardingStep(0);
    setShouldOpenPreferencesCard(true);
  };

  const handleOnboardingDataChange = (field: string, value: string) => {
    setOnboardingData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // Auto-calculate eDPI for display when sensitivity or DPI changes
      if (field === 'sensitivity' || field === 'dpi') {
        const sens = field === 'sensitivity' ? parseFloat(value) : parseFloat(newData.sensitivity);
        const dpi = field === 'dpi' ? parseInt(value) : parseInt(newData.dpi);
        if (!isNaN(sens) && !isNaN(dpi) && sens > 0 && dpi > 0) {
          newData.edpi = Math.round(sens * dpi).toString();
        }
      }

      return newData;
    });
  };

  const handleCompleteOnboarding = async () => {
    // Check if user went through the step-by-step process
    if (!onboardingData.selectedGame || !onboardingData.sensitivity || !onboardingData.dpi) {
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
      // Calculate mouseTravel from the selected game + sensitivity + DPI
      const gameData = games.find(g => g.game === onboardingData.selectedGame);
      if (!gameData) {
        setMessage('Selected game not found');
        return;
      }

      const mouseTravel = await window.sensitivityConverter.calculateMouseTravelFromGame(
        gameData,
        sensitivityNum,
        dpiNum
      );

      if (!mouseTravel || mouseTravel <= 0) {
        setMessage('Error calculating mouse travel distance');
        return;
      }

      // Save baseline settings (mouseTravel + dpi + favorite game info)
      const favoriteGame = onboardingData.selectedGame;
      const favoriteSensitivity = sensitivityNum;

      await (window.settings as any).setBaselineSettings(
        mouseTravel,
        dpiNum,
        favoriteGame,
        favoriteSensitivity,
        dpiNum * favoriteSensitivity
      );

      // Update baseline settings state
      const fetchedTrueSens = await window.sensitivityConverter.getTrueSens();
      const newSettings = {
        mouseTravel,
        dpi: dpiNum,
        trueSens: fetchedTrueSens ?? Math.round(mouseTravel * 10),
        favoriteGame,
        favoriteSensitivity,
        eDPI: dpiNum * favoriteSensitivity
      };
      setCanonicalSettings(newSettings);

      // Reload data to update suggestions
      await loadAllData();

      setShowOnboarding(false);
      setOnboardingStep(0);
      setOnboardingData({ selectedGame: '', sensitivity: '', dpi: '800', edpi: '' });
      if (isEditPreferencesMode) {
        setIsEditPreferencesMode(false);
        setShouldOpenPreferencesCard(true);
      }
      console.log('Onboarding complete. User preferences saved:', { mouseTravel, dpi: dpiNum, game: favoriteGame, sensitivity: favoriteSensitivity });
      setMessage('Baseline saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving onboarding settings:', error);
      setMessage('Error saving settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`main-window ${showOnboarding ? 'onboarding' : ''}`}>
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        showOnboarding={showOnboarding}
        onMinimize={handleMinimize}
        onClose={handleClose}
      />

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
                onBack={handleOnboardingStepBack}
                onComplete={handleCompleteOnboarding}
                onCancel={isEditPreferencesMode ? handleOnboardingCancel : undefined}
              />
            ) : (
              <>
                <HomeView
                  games={games}
                  currentGame={currentGame}
                  allDetectedGames={allDetectedGames}
                  canonicalSettings={canonicalSettings}
                  suggestedSensitivity={suggestedSensitivity}
                  mouseTravel={mouseTravel}
                  trueSens={trueSens}
                  isLoading={isLoading}
                  message={message}
                  setMessage={setMessage}
                  loadAllData={loadAllData}
                  currentGameIndex={currentGameIndex}
                  handlePreviousGame={handlePreviousGame}
                  handleNextGame={handleNextGame}
                  onEditPreferences={handleEditPreferences}
                  shouldOpenPreferencesCard={shouldOpenPreferencesCard}
                  onOpenPreferencesCardHandled={() => setShouldOpenPreferencesCard(false)}
                />
              </>
            )}
          </>
        ) : (
          <Settings handleRestartOnboarding={handleRestartOnboarding} onBack={() => setActiveTab('main')} />
        )}
        {!showOnboarding && (
          <section className="ad-section" hidden={showOnboarding}>
            <SvgIcon name="aimii-logo" />
            <owadview cid="aimii-main-window" />
            {/* <div className="terminal-container">
              <Terminal />
            </div> */}
          </section>
        )}
      </main>

    </div >
  );
};