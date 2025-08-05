import React from 'react';
import { SettingsFlow } from '../SettingsFlow/SettingsFlow';

interface CanonicalSettings {
  game: string;
  sensitivity: number;
  dpi: number;
  edpi: number;
}

interface GameData {
  game: string;
  sensitivityScalingFactor: number;
  owGameId: string;
  owConstant?: string;
  owGameName?: string;
  enable_for_app: boolean;
}

interface UserPreferencesContentProps {
  showForm: boolean;
  canonicalSettings: CanonicalSettings | null;
  cm360: number | null;
  games: GameData[];
  settingsData: {
    selectedGame: string;
    sensitivity: string;
    dpi: string;
    edpi: string;
    knowsEdpi: boolean | null;
  };
  settingsStep: number;
  isLoading: boolean;
  message: string;
  onDataChange: (field: string, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onShowForm: () => void;
  onCancelForm: () => void;
}

export const UserPreferencesContent: React.FC<UserPreferencesContentProps> = ({
  showForm,
  canonicalSettings,
  cm360,
  games,
  settingsData,
  settingsStep,
  isLoading,
  message,
  onDataChange,
  onNext,
  onBack,
  onShowForm,
  onCancelForm
}) => {
  return (
    <>
      {showForm ? (
        <SettingsFlow
          games={games}
          settingsData={settingsData}
          currentStep={settingsStep}
          isLoading={isLoading}
          message={message}
          onDataChange={onDataChange}
          onNext={onNext}
          onBack={onBack}
          onComplete={onNext}
          showProgress={false}
          inputPrefix="card"
        />
      ) : canonicalSettings ? (
        <div className="current-settings">

          <div className="main-setting">
            <div className="setting-row">
              <p>// {message ? (message.includes('Error') ? 'Error updating eDPI' : 'UPDATED eDPI') : 'YOUR SAVED eDPI'}
                <button
                  className="btn btn-secondary btn-outline"
                  onClick={onShowForm}
                >
                  Change eDPI
                </button>
              </p>
              {/* <span className="setting-label">eDPI</span> */}
              <span className="setting-value">{canonicalSettings.edpi}
              </span>
            </div>
          </div>
          <p>// EQUIVALENT TO</p>
          <div className="settings-grid">
            <div className="setting-row">
              <span className="setting-label">Game</span>
              <span className="setting-value">{canonicalSettings.game}</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">Sensitivity</span>
              <span className="setting-value">{canonicalSettings.sensitivity}</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">DPI</span>
              <span className="setting-value">{canonicalSettings.dpi}</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">CM/360°</span>
              <span className="setting-value">{cm360 !== null ? `${cm360} cm` : 'Calculating...'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-empty">
          <p>No settings configured</p>
        </div>
      )}
    </>
  );
};