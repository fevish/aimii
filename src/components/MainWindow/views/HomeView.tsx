import React, { useState, useCallback } from 'react';
import { GameInfo } from '../GameInfo';
import { CardButton } from '../../CardButton/CardButton';
import { UserPreferencesContent } from '../../CardButton/UserPreferencesContent';
import { SecondaryCardContent } from '../../CardButton/SecondaryCardContent';
import { AimTrainerCardContent } from '../../CardButton/AimTrainerCardContent';
import { formatSensitivity } from '../../../utils/format';
import { GameData, BaselineSettings } from '../../../types/app';
import { CurrentGameInfo } from '../../../browser/services/current-game.service';
import { SensitivityConversion } from '../../../browser/services/sensitivity-converter.service';

interface HomeViewProps {
  games: GameData[];
  currentGame: CurrentGameInfo | null;
  allDetectedGames: CurrentGameInfo[];
  canonicalSettings: BaselineSettings | null;
  suggestedSensitivity: SensitivityConversion | null;
  mouseTravel: number | null;
  trueSens: number | null;
  isLoading: boolean;
  message: string;
  setMessage: (msg: string) => void;
  loadAllData: () => Promise<void>;
  currentGameIndex: number;
  handlePreviousGame: () => void;
  handleNextGame: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  games,
  currentGame,
  allDetectedGames,
  canonicalSettings,
  suggestedSensitivity,
  mouseTravel,
  trueSens,
  isLoading,
  message,
  setMessage,
  loadAllData,
  currentGameIndex,
  handlePreviousGame,
  handleNextGame
}) => {
  // Card states
  const [isUserPreferencesCardOpen, setIsUserPreferencesCardOpen] = useState<boolean>(false);
  const [isSecondaryCardOpen, setIsSecondaryCardOpen] = useState<boolean>(false);
  const [isAimTrainerCardOpen, setIsAimTrainerCardOpen] = useState<boolean>(false);
  const [showUserPreferencesForm, setShowUserPreferencesForm] = useState<boolean>(false);

  const [userPreferencesSettingsData, setUserPreferencesSettingsData] = useState({
    selectedGame: '',
    sensitivity: '',
    dpi: '',
    edpi: ''
  });
  const [userPreferencesSettingsStep, setUserPreferencesSettingsStep] = useState(1);

  // Calculator state
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

  const handleOpenUserPreferencesCard = () => {
    setIsUserPreferencesCardOpen(true);
    setShowUserPreferencesForm(false);
  };

  const handleCloseUserPreferencesCard = () => {
    setIsUserPreferencesCardOpen(false);
    setShowUserPreferencesForm(false);
  };

  const handleOpenSecondaryCard = () => setIsSecondaryCardOpen(true);
  const handleCloseSecondaryCard = () => setIsSecondaryCardOpen(false);
  const handleOpenAimTrainerCard = () => setIsAimTrainerCardOpen(true);
  const handleCloseAimTrainerCard = () => setIsAimTrainerCardOpen(false);

  const handleShowUserPreferencesForm = () => {
    setShowUserPreferencesForm(true);
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
    setUserPreferencesSettingsData({
      selectedGame: '',
      sensitivity: '',
      dpi: canonicalSettings?.dpi?.toString() || '800',
      edpi: ''
    });
    setUserPreferencesSettingsStep(1);
  };

  const handleUserPreferencesDataChange = useCallback((field: string, value: string) => {
    setUserPreferencesSettingsData(prev => {
      const newData = { ...prev, [field]: value };
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

  const handleSaveSettingsFromCard = async (game: string, sensitivity: number, dpi: number, customMessage?: string): Promise<boolean> => {
    try {
      const gameData = games.find(g => g.game === game);
      if (!gameData) {
        setMessage('Game not found');
        setTimeout(() => setMessage(''), 3000);
        return false;
      }

      const newMouseTravel = await window.sensitivityConverter.calculateMouseTravelFromGame(gameData, sensitivity, dpi);
      if (!newMouseTravel) {
        setMessage('Error calculating mouse travel');
        setTimeout(() => setMessage(''), 3000);
        return false;
      }

      const eDPI = dpi * sensitivity;
      const success = await (window.settings as any).setBaselineSettings(newMouseTravel, dpi, game, sensitivity, eDPI);
      if (success) {
        await loadAllData();
        setShowUserPreferencesForm(false);
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

  const handleUserPreferencesNext = async () => {
    if (userPreferencesSettingsStep < 3) {
      setUserPreferencesSettingsStep(prev => prev + 1);
      return;
    }

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

  return (
    <section className="main-section">
      <div className="info-section">
        {!currentGame && (
          <>
            <h2>You're ready to go!</h2>
            <p>Launch a game and we'll recommend a sensitivity for you based on your saved preferences.</p>
            <div className="notes-section">
              <h3>Notes</h3>
              <ul>
                <li>
                  <p>
                    <b>This app is early access</b><br />
                    Features may change or break. Please report bugs to&nbsp;<a onClick={() => window.electronAPI?.openExternalUrl('https://discord.gg/Nj2Xj3W4eY')}>@fevish on our Discord</a>.
                  </p>
                </li>
              </ul>
            </div>
          </>
        )}

        {currentGame && (
          <GameInfo
            title={allDetectedGames.length > 1 ? 'Multiple Games Detected' : 'Supported Game Detected'}
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
            games={games}
            calculatorState={calculatorState}
            onCalculatorStateChange={setCalculatorState}
          />
        </CardButton>

        <CardButton
          title="Aim Trainer"
          value="3D practice"
          iconName="arrow-north-east"
          isOpen={isAimTrainerCardOpen}
          onToggle={handleOpenAimTrainerCard}
          onClose={handleCloseAimTrainerCard}
          className="card-secondary"
          contentTitle="Aim Trainer"
        >
          <AimTrainerCardContent
            mouseTravel={canonicalSettings?.mouseTravel ?? mouseTravel ?? null}
            canonicalSettings={canonicalSettings}
          />
        </CardButton>
      </div>
    </section>
  );
};
