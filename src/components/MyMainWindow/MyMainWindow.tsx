import React, { useState, useEffect, useCallback } from 'react';

import Settings from '../Settings/Settings';
import { SvgIcon } from '../SvgIcon/SvgIcon';
import { Onboarding } from '../Onboarding';
import { CardButton } from '../CardButton/CardButton';
import { UserPreferencesContent } from '../CardButton/UserPreferencesContent';
import { SecondaryCardContent } from '../CardButton/SecondaryCardContent';
import { Terminal } from '../Terminal/Terminal';
import './MyMainWindow.css';
import { CurrentGameInfo } from '../../browser/services/current-game.service';
import { SensitivityConversion } from '../../browser/services/sensitivity-converter.service';
import { GameData, BaselineSettings, HotkeyInfo } from '../../types/app';
import { GameInfo } from './GameInfo';
import { useMainWindowData } from './useMainWindowData';
import { formatSensitivity } from '../../utils/format';
import { applyTheme } from '../../utils/theme';


export const MyMainWindow: React.FC = () => {
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

  // Card states
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
    edpi: ''
  });
  const [userPreferencesSettingsStep, setUserPreferencesSettingsStep] = useState(1);

  // Calculator state (persisted when card closes)
  const [calculatorState, setCalculatorState] = useState({
    fromGame: null as any,
    toGame: null as any,
    fromSensitivity: '',
    fromDpi: '',
    convertedSensitivity: 0,
    eDpi: 0,
    inches360: 0,
    cm360: 0
  });

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
  React.useEffect(() => {
    const setupAdDetection = () => {
      const adView = document.querySelector('owadview');
      const adSection = document.querySelector('.ad-section');

      if (!adView || !adSection) {
        console.warn('Ad detection: owadview or terminal-container not found');
        return null;
      }

                  const handleAdStart = (event: Event) => {
        console.log(`Ad started: ${event.type}`);
        adSection.classList.add('ad-running');
      };

      const handleAdEnd = (event: Event) => {
        console.log(`Ad ended: ${event.type}`);
        adSection.classList.remove('ad-running');
      };

            // Wait for WebView to be ready before adding event listeners
      const setupListeners = () => {
        console.log('adView element found:', !!adView);
        console.log('adView tagName:', adView.tagName);
        console.log('adView constructor:', adView.constructor.name);

        // Listen for ad start/end events (inspired by ow-native patterns)
        adView.addEventListener('play', handleAdStart);
        adView.addEventListener('display_ad_loaded', handleAdStart);
        adView.addEventListener('player_loaded', handleAdStart);
        adView.addEventListener('complete', handleAdEnd);

        // Additional events that might be available (from ow-native reference)
        adView.addEventListener('impression', (e) => console.log('Ad impression:', e));
        adView.addEventListener('error', (e) => console.log('Ad error:', e));
        adView.addEventListener('ow_internal_rendered', (e) => console.log('Ad internal rendered:', e));

        console.log('Ad detection: Listening for ad start/end events');
      };

      // Check if WebView is already ready, otherwise wait for dom-ready
      try {
        setupListeners();
      } catch (error) {
        console.log('Ad detection: Waiting for WebView to be ready...');
        adView.addEventListener('dom-ready', setupListeners, { once: true });
      }


      // Return cleanup function
      return () => {
        adView.removeEventListener('play', handleAdStart);
        adView.removeEventListener('display_ad_loaded', handleAdStart);
        adView.removeEventListener('player_loaded', handleAdStart);
        adView.removeEventListener('complete', handleAdEnd);
        adView.removeEventListener('impression', console.log);
        adView.removeEventListener('error', console.log);
        adView.removeEventListener('ow_internal_rendered', console.log);
        adView.removeEventListener('dom-ready', setupListeners);
      };
    };

    const cleanup = setupAdDetection();
    return cleanup || (() => { });
  }, []);

  const handleToggleWidget = async () => {
    try {
      await window.widget.toggleWidget();
    } catch (error) {
      console.error('Error toggling widget:', error);
      setMessage('Error toggling widget');
    }
  };

  const handleOpenUserPreferencesCard = () => {
    setIsUserPreferencesCardOpen(true);
    setShowUserPreferencesForm(false);
    // For now, use empty form data since we're transitioning to mouseTravel-only
    setUserPreferencesFormData({
      selectedGame: '',
      sensitivity: '',
      dpi: ''
    });
  };

  const handleCloseUserPreferencesCard = () => {
    setIsUserPreferencesCardOpen(false);
    setShowUserPreferencesForm(false);
  };

  const handleOpenSecondaryCard = () => {
    setIsSecondaryCardOpen(true);
  };

  const handleCloseSecondaryCard = () => {
    setIsSecondaryCardOpen(false);
  };

  const handleShowUserPreferencesForm = () => {
    setShowUserPreferencesForm(true);
    // Initialize settings data - simplified for baseline structure
    setUserPreferencesSettingsData({
      selectedGame: '',
      sensitivity: '',
      dpi: canonicalSettings?.dpi?.toString() || '800',
      edpi: ''
    });
    setUserPreferencesSettingsStep(1);
  };

  const handleCancelUserPreferencesForm = () => {
    setShowUserPreferencesForm(false);
    setUserPreferencesFormData({
      selectedGame: '',
      sensitivity: '',
      dpi: ''
    });
    // Reset settings flow data
    setUserPreferencesSettingsData({
      selectedGame: '',
      sensitivity: '',
      dpi: canonicalSettings?.dpi?.toString() || '800',
      edpi: ''
    });
    setUserPreferencesSettingsStep(1);
  };

  const handleUserPreferencesNext = async () => {
    if (userPreferencesSettingsStep < 3) {
      setUserPreferencesSettingsStep(prev => prev + 1);
      return;
    }

    // Step 3: save
    if (!userPreferencesSettingsData.selectedGame || !userPreferencesSettingsData.sensitivity || !userPreferencesSettingsData.dpi) {
      setMessage('Please fill in all fields');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const success = await handleSaveSettingsFromCard(
      userPreferencesSettingsData.selectedGame,
      parseFloat(userPreferencesSettingsData.sensitivity),
      parseInt(userPreferencesSettingsData.dpi),
      'Baseline updated'
    );

    if (success) {
      setShowUserPreferencesForm(false);
      setUserPreferencesSettingsStep(1);
    }
  };

  const handleUserPreferencesBack = () => {
    if (userPreferencesSettingsStep > 1) {
      setUserPreferencesSettingsStep(prev => prev - 1);
    }
  };

  const handleUserPreferencesDataChange = useCallback((field: string, value: string) => {
    setUserPreferencesSettingsData(prev => {
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
  }, []);

  const handleResetSettingsFromCard = () => {
    setIsUserPreferencesCardOpen(false);
    // handleResetCanonicalSettings(); // This function is removed
  };

  const handleSaveSettingsFromCard = async (game: string, sensitivity: number, dpi: number, customMessage?: string): Promise<boolean> => {
    try {
      // Find the game data to calculate mouse travel
      const gameData = games.find(g => g.game === game);
      if (!gameData) {
        setMessage('Game not found');
        setTimeout(() => setMessage(''), 3000);
        return false;
      }

      // Calculate mouse travel from the game + sensitivity + dpi
      const mouseTravel = await window.sensitivityConverter.calculateMouseTravelFromGame(gameData, sensitivity, dpi);
      if (!mouseTravel) {
        setMessage('Error calculating mouse travel');
        setTimeout(() => setMessage(''), 3000);
        return false;
      }

      // Save baseline settings (mouseTravel + dpi + favorite game info)
      const eDPI = dpi * sensitivity;
      const success = await (window.settings as any).setBaselineSettings(mouseTravel, dpi, game, sensitivity, eDPI);
      if (success) {
        console.log('User preferences updated and saved:', { mouseTravel, dpi, game, sensitivity });
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
      await (window.settings as any).clearBaselineSettings();

      // Reset all state
      setCanonicalSettings(null);

      setSuggestedSensitivity(null);
      setOnboardingData({ selectedGame: '', sensitivity: '', dpi: '', edpi: '' });
      setOnboardingStep(0);
      setShowOnboarding(true);

      // Switch to main tab to show onboarding
      setActiveTab('main');

      console.log('Onboarding restarted - all settings cleared');
    } catch (error) {
      console.error('Error restarting onboarding:', error);
    }
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

  const handleOnboardingBack = () => {
    if (onboardingStep > 0) {
      setOnboardingStep(prev => prev - 1);
    }
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
      await (window.settings as any).setBaselineSettings(mouseTravel, dpiNum, favoriteGame, favoriteSensitivity, dpiNum * favoriteSensitivity);

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

      // Hide onboarding and show main screen
      setShowOnboarding(false);
      setOnboardingStep(0);
      setOnboardingData({ selectedGame: '', sensitivity: '', dpi: '800', edpi: '' });
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
    <div className={`my-main-window ${showOnboarding ? 'onboarding' : ''}`}>
      <header className="app-header">
        <div className="app-logo">
          <h1>aimii.app</h1>
          <span className="version">v{process.env.APP_VERSION}</span>
        </div>
        <div className="header-controls">
          {!showOnboarding && (
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
          )}
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
                onComplete={handleCompleteOnboarding}
              />
            ) : (
              <>
                <section className="main-section">
                  <div className="info-section">
                    {/* Default state - no games detected */}
                    {!currentGame && (
                      <>
                        <h2>Your ready to go!</h2>
                        <p>Launch a game and we'll recommend a sensitivity for you based on your saved preferences.</p>

                        <div className="notes-section">
                          <h3>Notes</h3>
                          <ul>
                            <li>
                              <p>
                                <b>This app is early access</b>
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
                        mouseTravel={mouseTravel}
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
                        mouseTravel={mouseTravel}
                        showNavigation={allDetectedGames.length > 1}
                        onPrevious={handlePreviousGame}
                        onNext={handleNextGame}
                        canNavigate={allDetectedGames.length > 1}
                      />
                    )}
                  </div>



                  <div className="cards-section">
                    <CardButton
                      title="Mouse Travel"
                      value={canonicalSettings?.mouseTravel ? `${formatSensitivity(canonicalSettings.mouseTravel)}` : 'Not set'}
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
                        mouseTravel={mouseTravel}
                        trueSens={trueSens}
                        games={games}
                        settingsData={userPreferencesSettingsData}
                        settingsStep={userPreferencesSettingsStep}
                        isLoading={isLoading}
                        message={message}
                        onDataChange={handleUserPreferencesDataChange}
                        onNext={handleUserPreferencesNext}
                        onBack={handleUserPreferencesBack}
                        onShowForm={handleShowUserPreferencesForm}
                        onCancelForm={handleCancelUserPreferencesForm}
                      />
                    </CardButton>

                    <CardButton
                      title="Calculator"
                      value=""
                      iconName="arrow-north-east"
                      isOpen={isSecondaryCardOpen}
                      onToggle={handleOpenSecondaryCard}
                      onClose={handleCloseSecondaryCard}
                      className="card-secondary"
                    >
                      <SecondaryCardContent
                        calculatorState={calculatorState}
                        onCalculatorStateChange={setCalculatorState}
                      />
                    </CardButton>
                  </div>
                </section>

              </>
            )}
          </>
        ) : (
          <Settings handleRestartOnboarding={handleRestartOnboarding} />
        )}

        <section className="ad-section" hidden={showOnboarding}>
          <owadview />
          <div className="terminal-container">
            <Terminal />
          </div>
        </section>
      </main>

    </div >
  );
};