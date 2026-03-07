import React from 'react';
import { formatSensitivity } from '../../utils/format';
import type { BaselineSettings } from '../../types/app';

export interface UserPreferencesContentProps {
  /** Current baseline preferences (game, sensitivity, DPI, etc.). Null when not set. */
  baselineSettings: BaselineSettings | null;
}

/**
 * Displays the user's current mouse travel preferences.
 * The parent is responsible for providing a "Change" (or similar) action via CardButton headerActions
 * that triggers onboarding restart or opens an edit flow.
 */
export const UserPreferencesContent: React.FC<UserPreferencesContentProps> = ({
  baselineSettings
}) => {
  if (!baselineSettings) {
    return (
      <div className="card-empty">
        <p>No settings configured</p>
      </div>
    );
  }

  return (
    <div className="current-settings">
      <div className="main-setting">
        <div className="setting-row">
          <h3 className="heading">// MOUSE TRAVEL cm/360°</h3>
          <p className="value-large">{formatSensitivity(baselineSettings.mouseTravel)}</p>
        </div>
      </div>
      <h3 className="heading">// EQUIVALENT TO</h3>
      <div className="settings-grid">
        <div className="setting-row">
          <span className="setting-label">Game</span>
          <span className="setting-value">{baselineSettings.favoriteGame || 'Baseline (Any)'}</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">Sensitivity</span>
          <span className="setting-value">{baselineSettings.favoriteSensitivity}</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">eDPI</span>
          <span className="setting-value">{baselineSettings.eDPI}</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">Mouse DPI</span>
          <span className="setting-value">{baselineSettings.dpi}</span>
        </div>
      </div>
    </div>
  );
};
