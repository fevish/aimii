import React from 'react';
import './Onboarding.css';

interface GameData {
  game: string;
  sensitivityScalingFactor: number;
  owGameId: string;
  owConstant?: string;
  owGameName?: string;
  enable_for_app: boolean;
}

interface OnboardingData {
  selectedGame: string;
  sensitivity: string;
  dpi: string;
  edpi: string;
  knowsEdpi: boolean | null;
}

interface OnboardingProps {
  games: GameData[];
  onboardingData: OnboardingData;
  onboardingStep: number;
  isLoading: boolean;
  message: string;
  onDataChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  games,
  onboardingData,
  onboardingStep,
  isLoading,
  message,
  onDataChange,
  onNext,
  onBack
}) => {
  // Calculate eDPI when sensitivity or DPI changes
  React.useEffect(() => {
    if (onboardingData.sensitivity && onboardingData.dpi) {
      const sensitivity = parseFloat(onboardingData.sensitivity);
      const dpi = parseInt(onboardingData.dpi);
      if (!isNaN(sensitivity) && !isNaN(dpi) && sensitivity > 0 && dpi > 0) {
        const calculatedEdpi = (sensitivity * dpi).toFixed(0);
        if (calculatedEdpi !== onboardingData.edpi) {
          onDataChange('edpi', calculatedEdpi);
        }
      }
    }
  }, [onboardingData.sensitivity, onboardingData.dpi, onboardingData.edpi, onDataChange]);

  const handleKnowsEdpiChoice = (knows: boolean) => {
    onDataChange('knowsEdpi', knows ? 'true' : 'false');
  };

  return (
    <section className="onboarding-section">
      <div className="onboarding-container">
        {onboardingData.knowsEdpi === false && (
          <div className="onboarding-progress">
            <div className={`progress-step ${onboardingStep >= 1 ? 'active' : ''}`}>1</div>
            <div className={`progress-step ${onboardingStep >= 2 ? 'active' : ''}`}>2</div>
            <div className={`progress-step ${onboardingStep >= 3 ? 'active' : ''}`}>3</div>
          </div>
        )}

        {onboardingStep === 1 && onboardingData.knowsEdpi === null && (
          <div className="onboarding-step">
            <h2>Let's get started!</h2>
            <p>Do you know your eDPI?</p>

            <div className="choice-buttons">
              <button
                className="choice-btn choice-btn-yes"
                onClick={() => handleKnowsEdpiChoice(true)}
              >
                Yes, I know my eDPI
              </button>
              <button
                className="choice-btn choice-btn-no"
                onClick={() => handleKnowsEdpiChoice(false)}
              >
                No, help me set it!
              </button>
            </div>
          </div>
        )}

        {onboardingStep === 1 && onboardingData.knowsEdpi === true && (
          <div className="onboarding-step">
            <h2>Enter your eDPI</h2>
            <p>Please enter your eDPI value below.</p>

            <div className="form-group">
              <label htmlFor="onboarding-edpi-input">Your eDPI</label>
              <input
                id="onboarding-edpi-input"
                type="text"
                value={onboardingData.edpi}
                onChange={(e) => onDataChange('edpi', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onboardingData.edpi) {
                    onNext();
                  }
                }}
                placeholder="280"
                required
              />
              <small>eDPI = In-Game Sensitivity × Mouse DPI</small>
            </div>
          </div>
        )}

        {onboardingStep === 1 && onboardingData.knowsEdpi === false && (
          <div className="onboarding-step">
            <h2>Choose your eDPI</h2>
            <p>Don't know your eDPI? Select your most played game below.</p>

            <div className="form-group">
              <label htmlFor="onboarding-game-select">Select your most played game</label>
              <select
                id="onboarding-game-select"
                value={onboardingData.selectedGame}
                onChange={(e) => onDataChange('selectedGame', e.target.value)}
                required
              >
                <option value="">Select a Game</option>
                {games.map((game) => (
                  <option key={game.game} value={game.game}>
                    {game.game}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {onboardingStep === 2 && onboardingData.knowsEdpi === false && (
          <div className="onboarding-step">
            <h2>Choose your sensitivity</h2>
            <p>Enter your in-game sensitivity for {onboardingData.selectedGame}.</p>

            <div className="form-group">
              <label htmlFor="onboarding-sensitivity-input">In-Game Sensitivity</label>
              <input
                id="onboarding-sensitivity-input"
                type="text"
                value={onboardingData.sensitivity}
                onChange={(e) => onDataChange('sensitivity', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onboardingData.sensitivity) {
                    onNext();
                  }
                }}
                placeholder="0.35"
                required
              />
            </div>
          </div>
        )}

        {onboardingStep === 3 && onboardingData.knowsEdpi === false && (
          <div className="onboarding-step">
            <h2>What is your mouse DPI?</h2>
            <p>Enter your mouse DPI setting.</p>

            <div className="form-group">
              <label htmlFor="onboarding-dpi-input">Mouse DPI</label>
              <input
                id="onboarding-dpi-input"
                type="text"
                value={onboardingData.dpi}
                onChange={(e) => onDataChange('dpi', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && onboardingData.dpi) {
                    onNext();
                  }
                }}
                placeholder="800"
                required
              />
            </div>
          </div>
        )}

                        {onboardingData.knowsEdpi === true && (
          <div className="onboarding-navigation">
            <button
              onClick={onNext}
              className="onboarding-btn onboarding-btn-next"
              disabled={isLoading || !onboardingData.edpi}
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </button>
          </div>
        )}

        {onboardingData.knowsEdpi === false && (
          <div className="onboarding-navigation">
            {onboardingStep > 1 && (
              <button
                onClick={onBack}
                className="onboarding-btn onboarding-btn-back"
                disabled={isLoading}
              >
                Back
              </button>
            )}
            <button
              onClick={onNext}
              className="onboarding-btn onboarding-btn-next"
              disabled={
                isLoading ||
                (onboardingStep === 1 && !onboardingData.selectedGame) ||
                (onboardingStep === 2 && !onboardingData.sensitivity) ||
                (onboardingStep === 3 && !onboardingData.dpi)
              }
            >
              {onboardingStep === 3 ? (isLoading ? 'Saving...' : 'Complete') : 'Next'}
            </button>
          </div>
        )}

        {message && (
          <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}
      </div>
    </section>
  );
};