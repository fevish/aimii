import React, { useState, useEffect } from 'react';
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
  onComplete: () => void;
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
  onRestart,
  onComplete
}) => {
  const [isCMPRequired, setIsCMPRequired] = useState<boolean>(false);

  useEffect(() => {
    const checkCMPRequirement = async () => {
      try {
        const required = await window.cmp.isRequired();
        setIsCMPRequired(required);
      } catch (error) {
        console.error('Failed to check CMP requirement:', error);
        setIsCMPRequired(false);
      }
    };

    checkCMPRequirement();
  }, []);
  // Step 0: Welcome screen with Continue only
  if (onboardingStep === 0) {
    return (
      <section className="onboarding-section">
        <div className="onboarding-container">
          <div className="settings-flow">
            <h2>Let's make your aim conistent!</h2>
            <p>To begin, we're going to calculate your <b>Mouse Travel cm/360°</b>.</p>
            <p>You can always change this later!</p>
            <div className="settings-navigation">
              <button className="settings-btn settings-btn-next" onClick={onNext} autoFocus>Begin</button>
            </div>
          </div>
        </div>
        {/* Privacy Link - Only show for EU users */}
        {isCMPRequired && (
          <button className="privacy-link"
            onClick={async () => {
              try {
                await window.cmp.openPrivacySettings();
              } catch (error) {
                console.error('Failed to open privacy settings:', error);
              }
            }}
          >
            Privacy Settings
          </button>
        )}
      </section>
    );
  }

  return (
    <section className="onboarding-section">
      <div className="onboarding-container">
        <SettingsFlow
          games={games}
          settingsData={onboardingData}
          currentStep={onboardingStep} // onboardingStep 1-3 maps to currentStep 1-3
          isLoading={isLoading}
          message={message}
          onDataChange={onDataChange}
          onNext={onNext}
          onBack={onBack}
          onComplete={onComplete}
          showProgress={true}
          context="onboarding"
        />
      </div>
    </section>
  );
};
