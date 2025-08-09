import React from 'react';
import { SettingsFlow } from '../SettingsFlow/SettingsFlow';
import { BaselineSettings, GameData } from '../../types/app';

interface UserPreferencesContentProps {
  showForm: boolean;
  canonicalSettings: BaselineSettings | null;
  mouseTravel: number | null;
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
          context="preferences"
        />
      ) : canonicalSettings ? (
        <div className="current-settings">
          <div className="main-setting">
            <div className="setting-row">
              <p>// YOUR BASELINE SETTINGS
                <button
                  className="btn btn-secondary btn-outline"
                  onClick={onShowForm}
                >
                  Change Settings
                </button>
              </p>
              <span className="setting-value">{canonicalSettings.mouseTravel.toFixed(2)} cm/360°
              </span>
            </div>
          </div>
          <p>// EQUIVALENT TO</p>
          <div className="settings-grid">
            <div className="setting-row">
              <span className="setting-label">Game</span>
              <span className="setting-value">Baseline (Any)</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">Sensitivity</span>
              <span className="setting-value">Baseline Settings</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">DPI</span>
              <span className="setting-value">{canonicalSettings.dpi}</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">Mouse Travel</span>
              <span className="setting-value">{canonicalSettings.mouseTravel.toFixed(2)} cm</span>
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
