import React from 'react';
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
}

interface SettingsFlowProps {
  games: GameData[];
  settingsData: SettingsData;
  currentStep: number; // 1..3
  isLoading: boolean;
  message: string;
  onDataChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
  showProgress?: boolean;
  inputPrefix?: string;
  context?: 'onboarding' | 'preferences';
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
  inputPrefix = '',
  context = 'onboarding'
}) => {
  const getInputId = (baseId: string) => (inputPrefix ? `${inputPrefix}-${baseId}` : baseId);

  const canProceed = (): boolean => {
    if (isLoading) return false;

    if (currentStep === 1) {
      return !!(settingsData.selectedGame && settingsData.selectedGame.trim() !== '');
    }

    if (currentStep === 2) {
      if (!settingsData.sensitivity || settingsData.sensitivity.trim() === '') return false;
      const sensitivityNum = parseFloat(settingsData.sensitivity);
      return !isNaN(sensitivityNum) && sensitivityNum > 0;
    }

    if (currentStep === 3) {
      if (!settingsData.dpi || settingsData.dpi.trim() === '') return false;
      const dpiNum = parseInt(settingsData.dpi);
      return !isNaN(dpiNum) && dpiNum > 0;
    }

    return false;
  };

  const handlePrimary = () => {
    if (currentStep < 3) onNext();
    else onComplete();
  };

  const showBackButton = true;

  return (
    <div className="settings-flow">
      {showProgress && (
        <div className="settings-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''}`}>1</div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''}`}>2</div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''}`}>3</div>
        </div>
      )}

      {currentStep === 1 && (
        <GameSelectionStep
          games={games}
          selectedGame={settingsData.selectedGame}
          onDataChange={onDataChange}
          inputId={getInputId('game-select')}
          context={context}
          onNext={handlePrimary}
        />
      )}

      {currentStep === 2 && (
        <SensitivityInputStep
          sensitivity={settingsData.sensitivity}
          selectedGame={settingsData.selectedGame}
          onDataChange={onDataChange}
          inputId={getInputId('sensitivity-input')}
          context={context}
          onNext={handlePrimary}
        />
      )}

      {currentStep === 3 && (
        <DpiInputStep
          dpi={settingsData.dpi}
          onDataChange={onDataChange}
          inputId={getInputId('dpi-input')}
          context={context}
          onNext={handlePrimary}
        />
      )}

      <div className="settings-navigation">
        {showBackButton && (
          <button
            className="btn btn-outline settings-btn settings-btn-back"
            onClick={onBack}
            disabled={isLoading}
          >
            Back
          </button>
        )}
        <button
          className="settings-btn settings-btn-next"
          onClick={handlePrimary}
          disabled={!canProceed()}
        >
          {currentStep < 3 ? 'Next' : 'Complete'}
        </button>
      </div>

      {message && (
        <div className="settings-message">
          {message}
        </div>
      )}
    </div>
  );
};

