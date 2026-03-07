import React, { useState, useEffect } from 'react';
import { GameInfo } from '../GameInfo';
import { CardButton } from '../../CardButton/CardButton';
import { UserPreferencesContent } from '../../CardButton/UserPreferencesContent';
import { SvgIcon } from '../../SvgIcon/SvgIcon';
import { CalculatorCardContent } from '../../CardButton/CalculatorCardContent';
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
  /** Open onboarding at step 1 to edit preferences (Cancel returns to home with preferences card open) */
  onEditPreferences: () => void;
  /** When true, open the preferences card (e.g. after cancelling edit or after completing edit) */
  shouldOpenPreferencesCard: boolean;
  /** Call after opening the preferences card so parent can clear the flag */
  onOpenPreferencesCardHandled: () => void;
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
  handleNextGame,
  onEditPreferences,
  shouldOpenPreferencesCard,
  onOpenPreferencesCardHandled
}) => {
  const [isPreferencesCardOpen, setIsPreferencesCardOpen] = useState(false);
  const [openPreferencesWithoutTransition, setOpenPreferencesWithoutTransition] = useState(false);
  const [isCalculatorCardOpen, setIsCalculatorCardOpen] = useState(false);
  const [isAimTrainerCardOpen, setIsAimTrainerCardOpen] = useState(false);

  useEffect(() => {
    if (shouldOpenPreferencesCard) {
      setOpenPreferencesWithoutTransition(true);
      setIsPreferencesCardOpen(true);
      onOpenPreferencesCardHandled();
    }
  }, [shouldOpenPreferencesCard, onOpenPreferencesCardHandled]);

  useEffect(() => {
    if (!openPreferencesWithoutTransition || !isPreferencesCardOpen) return;
    const t = setTimeout(() => setOpenPreferencesWithoutTransition(false), 100);
    return () => clearTimeout(t);
  }, [openPreferencesWithoutTransition, isPreferencesCardOpen]);

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

  // Default "convert from" to user's current game, sensitivity, and DPI when calculator is pristine
  useEffect(() => {
    const isPristine = !calculatorState.fromGame && !calculatorState.fromSensitivity && !calculatorState.fromDpi;
    if (!isPristine || (!currentGame && !canonicalSettings)) return;

    const fromGame = currentGame
      ? games.find(g => g.game === currentGame.name)
      : canonicalSettings?.favoriteGame
        ? games.find(g => g.game === canonicalSettings.favoriteGame)
        : null;
    const fromSensitivity = (suggestedSensitivity?.suggestedSensitivity ?? canonicalSettings?.favoriteSensitivity)?.toString() ?? '';
    const fromDpi = canonicalSettings?.dpi?.toString() ?? '800';

    if (fromGame || fromSensitivity || fromDpi) {
      setCalculatorState(prev => ({
        ...prev,
        fromGame: fromGame ?? prev.fromGame,
        fromSensitivity: fromSensitivity || prev.fromSensitivity,
        fromDpi: fromDpi || prev.fromDpi
      }));
    }
  }, [currentGame, games, suggestedSensitivity, canonicalSettings]);

  const handleOpenPreferencesCard = () => setIsPreferencesCardOpen(true);
  const handleClosePreferencesCard = () => setIsPreferencesCardOpen(false);
  const handleOpenCalculatorCard = () => setIsCalculatorCardOpen(true);
  const handleCloseCalculatorCard = () => setIsCalculatorCardOpen(false);
  const handleOpenAimTrainerCard = () => setIsAimTrainerCardOpen(true);
  const handleCloseAimTrainerCard = () => setIsAimTrainerCardOpen(false);

  const handleChangePreferences = () => {
    handleClosePreferencesCard();
    handleCloseCalculatorCard();
    handleCloseAimTrainerCard();
    onEditPreferences();
  };

  return (
    <section className="main-section">
      <div className="info-section">
        {!currentGame && (
          <>
            <h2>You're ready to go!</h2>
            <p>Launch a game and we'll recommend a sensitivity for you based on your saved preferences.</p>
          </>
        )}
        <section className="notes-section">
          <h3>News</h3>
          <ul>
            <li>
              <p>
                <b>This app is in early development phase</b><br />
                Features may change, features may break. Please report bugs to&nbsp;<a onClick={() => window.electronAPI?.openExternalUrl('https://discord.gg/Nj2Xj3W4eY')}>@fevish on our Discord</a>.
              </p>
            </li>
          </ul>
        </section>

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
          value={canonicalSettings?.mouseTravel ? formatSensitivity(canonicalSettings.mouseTravel) : 'Not set'}
          iconName="arrow-north-east"
          isOpen={isPreferencesCardOpen}
          onToggle={handleOpenPreferencesCard}
          onClose={handleClosePreferencesCard}
          className="user-preferences"
          expandedTitle="Preferences"
          headerDescription={
            <>
              These settings will be used as your baseline for all games. You can{' '}
              <span
                role="button"
                tabIndex={0}
                className="link-button"
                onClick={handleChangePreferences}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleChangePreferences(); } }}
              >
                change this
              </span>
              {' '}at any time.
            </>
          }
          headerActions={
            <button
              type="button"
              className="btn btn-icon btn-pref"
              onClick={handleChangePreferences}
            >
              <SvgIcon name="edit" />
            </button>
          }
          openWithoutTransition={openPreferencesWithoutTransition}
        >
          <UserPreferencesContent baselineSettings={canonicalSettings} />
        </CardButton>

        <CardButton
          title="Calculator"
          value=""
          iconName="arrow-north-east"
          isOpen={isCalculatorCardOpen}
          onToggle={handleOpenCalculatorCard}
          onClose={handleCloseCalculatorCard}
          className="card-secondary"
          headerDescription="Use this calculater to quickly convert game sensitivities on the fly."
        >
          <CalculatorCardContent
            games={games}
            userPreferenceGameName={canonicalSettings?.favoriteGame ?? null}
            calculatorState={calculatorState}
            onCalculatorStateChange={setCalculatorState}
          />
        </CardButton>

        {/* <CardButton
          title="Aim Trainer"
          value=""
          iconName="arrow-north-east"
          isOpen={isAimTrainerCardOpen}
          onToggle={handleOpenAimTrainerCard}
          onClose={handleCloseAimTrainerCard}
          className="card-secondary card-aim-trainer"
          expandedTitle="Aim Trainer"
        >
          <AimTrainerCardContent
            baselineSettings={canonicalSettings}
            onChangePreferences={handleChangePreferences}
          />
        </CardButton> */}
      </div>
    </section>
  );
};
