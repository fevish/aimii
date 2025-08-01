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
  onRestart: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({
  games,
  onboardingData,
  onboardingStep,
  isLoading,
  message,
  onDataChange,
  onNext,
  onBack,
  onRestart
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

  // Auto-focus text inputs when screens load
  React.useEffect(() => {
    if (onboardingData.knowsEdpi === true) {
      // Focus eDPI input when user knows their eDPI
      const edpiInput = document.getElementById('onboarding-edpi-input');
      if (edpiInput) {
        edpiInput.focus();
      }
    } else if (onboardingData.knowsEdpi === false) {
      if (onboardingStep === 1) {
        // Focus game select when user doesn't know eDPI and is on step 1
        const gameSelect = document.getElementById('onboarding-game-select');
        if (gameSelect) {
          gameSelect.focus();
        }
      } else if (onboardingStep === 2) {
        // Focus sensitivity input on step 2
        const sensitivityInput = document.getElementById('onboarding-sensitivity-input');
        if (sensitivityInput) {
          sensitivityInput.focus();
        }
      } else if (onboardingStep === 3) {
        // Focus DPI input on step 3
        const dpiInput = document.getElementById('onboarding-dpi-input');
        if (dpiInput) {
          dpiInput.focus();
        }
      }
    }
  }, [onboardingData.knowsEdpi, onboardingStep]);

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
                className="btn btn-primary"
                onClick={() => handleKnowsEdpiChoice(true)}
              >
                Yes, I know my eDPI
              </button>
              <button
                className="btn btn-secondary"
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
              <div className="select-wrapper">
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

        {/* Show back button only after user has made initial choice */}
        {onboardingData.knowsEdpi !== null && (
          <div className="onboarding-navigation">
            <button
              className="onboarding-btn onboarding-btn-back"
              onClick={onBack}
              disabled={isLoading}
            >
              Back
            </button>

            <button
              onClick={onNext}
              className="onboarding-btn onboarding-btn-next"
              disabled={
                isLoading ||
                (onboardingData.knowsEdpi === true && !onboardingData.edpi) ||
                (onboardingData.knowsEdpi === false && onboardingStep === 1 && !onboardingData.selectedGame) ||
                (onboardingData.knowsEdpi === false && onboardingStep === 2 && !onboardingData.sensitivity) ||
                (onboardingData.knowsEdpi === false && onboardingStep === 3 && !onboardingData.dpi)
              }
            >
              {onboardingData.knowsEdpi === true
                ? (isLoading ? 'Saving...' : 'Continue')
                : (onboardingStep === 3 ? (isLoading ? 'Saving...' : 'Complete') : 'Next')
              }
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