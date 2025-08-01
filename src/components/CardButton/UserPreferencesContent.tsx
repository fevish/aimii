import React from 'react';

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
  formData: {
    selectedGame: string;
    sensitivity: string;
    dpi: string;
  };
  isLoading: boolean;
  message: string;
  onFormDataChange: (field: string, value: string) => void;
  onShowForm: () => void;
  onCancelForm: () => void;
  onSubmitForm: (e: React.FormEvent) => void;
}

export const UserPreferencesContent: React.FC<UserPreferencesContentProps> = ({
  showForm,
  canonicalSettings,
  cm360,
  games,
  formData,
  isLoading,
  message,
  onFormDataChange,
  onShowForm,
  onCancelForm,
  onSubmitForm
}) => {
    return (
    <>
      {showForm ? (
        <form onSubmit={onSubmitForm} className="card-form">
          <div className="form-group">
            <label htmlFor="card-game-select">Preferred Game</label>
            <select
              id="card-game-select"
              value={formData.selectedGame}
              onChange={(e) => onFormDataChange('selectedGame', e.target.value)}
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

          <div className="form-group">
            <label htmlFor="card-sensitivity-input">In-Game Sensitivity</label>
            <input
              id="card-sensitivity-input"
              type="text"
              step="any"
              min="0.001"
              value={formData.sensitivity}
              onChange={(e) => onFormDataChange('sensitivity', e.target.value)}
              placeholder="0.35"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="card-dpi-input">Mouse DPI</label>
            <input
              id="card-dpi-input"
              type="text"
              min="1"
              value={formData.dpi}
              onChange={(e) => onFormDataChange('dpi', e.target.value)}
              placeholder="800"
              required
            />
          </div>

          {message && (
            <div className={`card-message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}

          <div className="card-actions">
            <button type="submit" disabled={isLoading} className="card-btn card-btn-save">
              {isLoading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onCancelForm}
              disabled={isLoading}
              className="card-btn card-btn-cancel"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : canonicalSettings ? (
        <div className="current-settings">
          <div className="setting-row">
            <span className="setting-label">Game:</span>
            <span className="setting-value">{canonicalSettings.game}</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">Sensitivity:</span>
            <span className="setting-value">{canonicalSettings.sensitivity}</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">DPI:</span>
            <span className="setting-value">{canonicalSettings.dpi}</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">eDPI:</span>
            <span className="setting-value">{canonicalSettings.edpi}</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">CM/360°:</span>
            <span className="setting-value">{cm360 !== null ? `${cm360} cm` : 'Calculating...'}</span>
          </div>

          <div className="card-actions">
            <button
              className="card-btn card-btn-reset"
              onClick={onShowForm}
            >
              Change Settings
            </button>
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