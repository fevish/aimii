import React from 'react';
import { SettingsFlow } from '../SettingsFlow/SettingsFlow';
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
  return (
    <section className="onboarding-section">
      <div className="onboarding-container">
        <SettingsFlow
          games={games}
          settingsData={onboardingData}
          currentStep={onboardingStep}
          isLoading={isLoading}
          message={message}
          onDataChange={onDataChange}
          onNext={onNext}
          onBack={onBack}
          onComplete={onNext}
          showProgress={true}
          inputPrefix="onboarding"
        />
      </div>
    </section>
  );
};