import React from 'react';

interface SensitivityInputStepProps {
  sensitivity: string;
  selectedGame: string;
  onDataChange: (field: string, value: string) => void;
  onNext: () => void;
  inputId?: string;
}

export const SensitivityInputStep: React.FC<SensitivityInputStepProps> = ({
  sensitivity,
  selectedGame,
  onDataChange,
  onNext,
  inputId = 'sensitivity-input'
}) => {
  React.useEffect(() => {
    const input = document.getElementById(inputId);
    if (input) {
      input.focus();
    }
  }, [inputId]);

  return (
    <div className="settings-step">
      <h2>Choose your sensitivity</h2>
      <p>Enter your in-game sensitivity for {selectedGame}.</p>

      <div className="form-group">
        <label htmlFor={inputId}>In-Game Sensitivity</label>
        <input
          id={inputId}
          type="text"
          value={sensitivity}
          onChange={e => onDataChange('sensitivity', e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && sensitivity) {
              onNext();
            }
          }}
          placeholder="0.35"
          required
        />
      </div>
    </div>
  );
};
