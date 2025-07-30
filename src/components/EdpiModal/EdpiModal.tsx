import React, { useState } from 'react';
import './EdpiModal.css';

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

interface EdpiModalProps {
  isOpen: boolean;
  canonicalSettings: CanonicalSettings | null;
  cm360: number | null;
  games: GameData[];
  onClose: () => void;
  onResetSettings: () => void;
  onSaveSettings: (game: string, sensitivity: number, dpi: number) => Promise<boolean>;
  isLoading?: boolean;
  message?: string;
}

export const EdpiModal: React.FC<EdpiModalProps> = ({
  isOpen,
  canonicalSettings,
  cm360,
  games,
  onClose,
  onResetSettings,
  onSaveSettings,
  isLoading = false,
  message
}) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedGame, setSelectedGame] = useState('');
  const [sensitivity, setSensitivity] = useState('');
  const [dpi, setDpi] = useState('');

  if (!isOpen) return null;

  const handleShowForm = () => {
    setShowForm(true);
    setSelectedGame(canonicalSettings?.game || '');
    setSensitivity(canonicalSettings?.sensitivity?.toString() || '');
    setDpi(canonicalSettings?.dpi?.toString() || '');
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setSelectedGame('');
    setSensitivity('');
    setDpi('');
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGame || !sensitivity || !dpi) return;

    const success = await onSaveSettings(selectedGame, parseFloat(sensitivity), parseInt(dpi));
    if (success) {
      setShowForm(false);
      setSelectedGame('');
      setSensitivity('');
      setDpi('');
    }
  };

  return (
    <div className="edpi-modal-overlay" onClick={onClose}>
      <div className="edpi-modal" onClick={(e) => e.stopPropagation()}>
        <div className="edpi-modal-header">
          <h2>{showForm ? 'Change eDPI Settings' : 'Your eDPI Settings'}</h2>
          <button className="edpi-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="edpi-modal-content">
          {showForm ? (
            <form onSubmit={handleSaveForm} className="edpi-modal-form">
              <div className="form-group">
                <label htmlFor="modal-game-select">Preferred Game</label>
                <select
                  id="modal-game-select"
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
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
                <label htmlFor="modal-sensitivity-input">In-Game Sensitivity</label>
                <input
                  id="modal-sensitivity-input"
                  type="text"
                  step="any"
                  min="0.001"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value)}
                  placeholder="0.35"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="modal-dpi-input">Mouse DPI</label>
                <input
                  id="modal-dpi-input"
                  type="text"
                  min="1"
                  value={dpi}
                  onChange={(e) => setDpi(e.target.value)}
                  placeholder="800"
                  required
                />
              </div>

              {message && (
                <div className={`edpi-modal-message ${message.includes('Error') ? 'error' : 'success'}`}>
                  {message}
                </div>
              )}

              <div className="edpi-modal-actions">
                <button type="submit" disabled={isLoading} className="edpi-modal-btn edpi-modal-btn-save">
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  disabled={isLoading}
                  className="edpi-modal-btn edpi-modal-btn-cancel"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : canonicalSettings ? (
            <div className="edpi-settings">
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

              <div className="edpi-modal-actions">
                <button
                  className="edpi-modal-btn edpi-modal-btn-reset"
                  onClick={handleShowForm}
                >
                  Change Settings
                </button>
              </div>
            </div>
          ) : (
            <div className="edpi-modal-empty">
              <p>No settings configured</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};