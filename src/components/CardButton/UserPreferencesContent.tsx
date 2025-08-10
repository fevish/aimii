import React from 'react';
import { SettingsFlow } from '../SettingsFlow/SettingsFlow';
import { BaselineSettings, GameData } from '../../types/app';

interface UserPreferencesContentProps {
  showForm: boolean;
  canonicalSettings: BaselineSettings | null;
  mouseTravel: number | null;
  trueSens: number | null; // accept trueSens via props
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
  mouseTravel,
  trueSens,
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
  console.log('canonicalSettings', canonicalSettings);
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
          onBack={() => { if (settingsStep === 1) { onCancelForm(); } else { onBack(); } }}
          onComplete={onNext}
          showProgress={false}
          inputPrefix="card"
          context="preferences"
        />
      ) : canonicalSettings ? (
        <div className="current-settings">
          <div className="main-setting">
            <div className="setting-row">
              <p>// MOUSE TRAVEL (cm/360°)
                <button
                  className="btn btn-secondary btn-outline pref-btn"
                  onClick={onShowForm}
                >
                  Change
                </button>
              </p>
              <span className="setting-value">{canonicalSettings.mouseTravel.toFixed(2)}</span>
            </div>
          </div>
          <p>// EQUIVALENT TO</p>
          <div className="settings-grid">
            <div className="setting-row">
              <span className="setting-label">Game</span>
              <span className="setting-value">{canonicalSettings.favoriteGame || 'Baseline (Any)'}</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">Sensitivity</span>
              <span className="setting-value">{canonicalSettings.favoriteSensitivity}</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">eDPI</span>
              <span className="setting-value">{canonicalSettings.eDPI}</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">Mouse DPI</span>
              <span className="setting-value">{canonicalSettings.dpi}</span>
            </div>
            {/* <div className="setting-row">
              <span className="setting-label">Mouse Travel (cm/360°)</span>
              <span className="setting-value">{canonicalSettings.mouseTravel.toFixed(2)}</span>
            </div> */}
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
