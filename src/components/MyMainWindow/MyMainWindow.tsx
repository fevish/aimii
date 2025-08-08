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
import { GameData, CanonicalSettings, HotkeyInfo } from '../../types/app';
import { GameInfo } from './GameInfo';
import { useMainWindowData } from './useMainWindowData';

export const MyMainWindow: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [sensitivity, setSensitivity] = useState<string>('');
  const [dpi, setDpi] = useState<string>('800');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'main' | 'settings'>('main');
  const [currentGameIndex, setCurrentGameIndex] = useState<number>(0);

  const {
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
  } = useMainWindowData();

  // Onboarding state
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
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
    () => currentGame && canonicalSettings &&
    currentGame.name === canonicalSettings.game && currentGame.isSupported,
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

  const handleOpenSecondaryCard = () => {
    setIsSecondaryCardOpen(true);
  };

  const handleCloseSecondaryCard = () => {
    setIsSecondaryCardOpen(false);
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

      setSuggestedSensitivity(null);
      setOnboardingData({ selectedGame: '', sensitivity: '', dpi: '', edpi: '', knowsEdpi: null });
      setOnboardingStep(0);
      setShowOnboarding(true);

      // Switch to main tab to show onboarding
      setActiveTab('main');

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

        // Reload data to compute cm/360 and suggestions
        await loadAllData();

        // Hide onboarding and show main screen
        setShowOnboarding(false);
        setOnboardingStep(0);
        setOnboardingData({ selectedGame: '', sensitivity: '', dpi: '', edpi: '', knowsEdpi: null });
        setMessage('Baseline saved successfully!');
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

      // Reload data to compute cm/360 and suggestions
      await loadAllData();

      // Hide onboarding and show main screen
      setShowOnboarding(false);
      setOnboardingStep(0);
      setOnboardingData({ selectedGame: '', sensitivity: '', dpi: '800', edpi: '', knowsEdpi: null });
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
                        onDataChange={(field: string, value: string) => setUserPreferencesSettingsData(prev => ({
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

              </>
            )}
          </>
        ) : (
          <Settings handleRestartOnboarding={handleRestartOnboarding} />
        )}

        {!showOnboarding && (
          <section className="ad-section">
          </section>
        )}
      </main>

      </div >
  );
};
