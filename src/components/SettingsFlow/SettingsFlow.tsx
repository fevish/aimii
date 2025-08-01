import React from 'react';
import { EdpiChoiceStep } from './EdpiChoiceStep';
import { EdpiInputStep } from './EdpiInputStep';
import { GameSelectionStep } from './GameSelectionStep';
import { SensitivityInputStep } from './SensitivityInputStep';
import { DpiInputStep } from './DpiInputStep';
import './SettingsFlow.css';

interface GameData {
  game: string;
  sensitivityScalingFactor: number;
  owGameId: string;
  owConstant?: string;
  owGameName?: string;
  enable_for_app: boolean;
}

interface SettingsData {
  selectedGame: string;
  sensitivity: string;
  dpi: string;
  edpi: string;
  knowsEdpi: boolean | null;
}

interface SettingsFlowProps {
  games: GameData[];
  settingsData: SettingsData;
  currentStep: number;
  isLoading: boolean;
  message: string;
  onDataChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  showProgress?: boolean;
  inputPrefix?: string;
}

export const SettingsFlow: React.FC<SettingsFlowProps> = ({
  games,
  settingsData,
  currentStep,
  isLoading,
  message,
  onDataChange,
  onNext,
  onBack,
  onComplete,
  showProgress = true,
  inputPrefix = ''
}) => {
  // Calculate eDPI when sensitivity or DPI changes
  React.useEffect(() => {
    if (settingsData.sensitivity && settingsData.dpi) {
      const sensitivity = parseFloat(settingsData.sensitivity);
      const dpi = parseInt(settingsData.dpi);
      if (!isNaN(sensitivity) && !isNaN(dpi) && sensitivity > 0 && dpi > 0) {
        const calculatedEdpi = (sensitivity * dpi).toFixed(0);
        if (calculatedEdpi !== settingsData.edpi) {
          onDataChange('edpi', calculatedEdpi);
        }
      }
    }
  }, [settingsData.sensitivity, settingsData.dpi, settingsData.edpi, onDataChange]);

  const handleKnowsEdpiChoice = (knows: boolean) => {
    onDataChange('knowsEdpi', knows ? 'true' : 'false');
    // For "knowsEdpi === true", we stay on step 1 but show different content
    // For "knowsEdpi === false", we also stay on step 1 initially
  };

  const getInputId = (baseId: string) => {
    return inputPrefix ? `${inputPrefix}-${baseId}` : baseId;
  };

  const canProceed = () => {
    if (isLoading) return false;

    if (settingsData.knowsEdpi === true) {
      return !!settingsData.edpi;
    } else if (settingsData.knowsEdpi === false) {
      if (currentStep === 1) return !!settingsData.selectedGame;
      if (currentStep === 2) return !!settingsData.sensitivity;
      if (currentStep === 3) return !!settingsData.dpi;
    }
    return false;
  };

  const getNextButtonText = () => {
    if (isLoading) return 'Saving...';

    if (settingsData.knowsEdpi === true) {
      return 'Continue';
    } else if (settingsData.knowsEdpi === false) {
      return currentStep === 3 ? 'Complete' : 'Next';
    }
    return 'Next';
  };

  return (
    <div className="settings-flow">
      {showProgress && settingsData.knowsEdpi === false && (
        <div className="settings-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
        </div>
      )}

      {currentStep === 1 && settingsData.knowsEdpi === null && (
        <EdpiChoiceStep onChoice={handleKnowsEdpiChoice} />
      )}

      {currentStep === 1 && settingsData.knowsEdpi === true && (
        <EdpiInputStep
          edpi={settingsData.edpi}
          onDataChange={onDataChange}
          onNext={onNext}
          inputId={getInputId('edpi-input')}
        />
      )}

      {currentStep === 1 && settingsData.knowsEdpi === false && (
        <GameSelectionStep
          games={games}
          selectedGame={settingsData.selectedGame}
          onDataChange={onDataChange}
          inputId={getInputId('game-select')}
        />
      )}

      {currentStep === 2 && settingsData.knowsEdpi === false && (
        <SensitivityInputStep
          sensitivity={settingsData.sensitivity}
          selectedGame={settingsData.selectedGame}
          onDataChange={onDataChange}
          onNext={onNext}
          inputId={getInputId('sensitivity-input')}
        />
      )}

      {currentStep === 3 && settingsData.knowsEdpi === false && (
        <DpiInputStep
          dpi={settingsData.dpi}
          onDataChange={onDataChange}
          onNext={onNext}
          inputId={getInputId('dpi-input')}
        />
      )}

      {/* Navigation buttons */}
      {settingsData.knowsEdpi !== null && (
        <div className="settings-navigation">
          <button
            className="settings-btn settings-btn-back"
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </button>

          <button
            onClick={onNext}
            className="settings-btn settings-btn-next"
            disabled={!canProceed()}
          >
            {getNextButtonText()}
          </button>
        </div>
      )}

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
};