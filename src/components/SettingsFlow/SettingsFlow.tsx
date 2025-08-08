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
  edpi: string; // unused in this flow but kept for compatibility
  knowsEdpi: boolean | null; // unused in this flow but kept for compatibility
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
    if (currentStep === 1) return !!settingsData.dpi;
    if (currentStep === 2) return !!settingsData.selectedGame;
    if (currentStep === 3) return !!settingsData.sensitivity;
    return false;
  };

  const handlePrimary = () => {
    if (currentStep < 3) onNext();
    else onComplete();
  };

  const showBackButton = !(context === 'onboarding' && currentStep === 1);

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
        <DpiInputStep
          dpi={settingsData.dpi}
          onDataChange={onDataChange}
          onNext={onNext}
          inputId={getInputId('dpi-input')}
          context={context}
        />
      )}

      {currentStep === 2 && (
        <GameSelectionStep
          games={games}
          selectedGame={settingsData.selectedGame}
          onDataChange={onDataChange}
          inputId={getInputId('game-select')}
          context={context}
        />
      )}

      {currentStep === 3 && (
        <SensitivityInputStep
          sensitivity={settingsData.sensitivity}
          selectedGame={settingsData.selectedGame}
          onDataChange={onDataChange}
          onNext={onNext}
          inputId={getInputId('sensitivity-input')}
          context={context}
        />
      )}

      <div className="settings-navigation">
        {showBackButton && (
          <button
            className="settings-btn settings-btn-back"
            onClick={onBack}
            disabled={isLoading || currentStep === 1}
          >
            Back
          </button>
        )}

        <button
          onClick={handlePrimary}
          className="settings-btn settings-btn-next"
          disabled={!canProceed()}
        >
          {currentStep < 3 ? 'Next' : 'Complete'}
        </button>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}
    </div>
  );
}

