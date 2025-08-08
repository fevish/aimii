import React from 'react';

interface SensitivityInputStepProps {
  sensitivity: string;
  selectedGame: string;
  onDataChange: (field: string, value: string) => void;
  inputId?: string;
  context?: 'onboarding' | 'preferences';
  onNext?: () => void;
}

export const SensitivityInputStep: React.FC<SensitivityInputStepProps> = ({
  sensitivity,
  selectedGame,
  onDataChange,
  inputId = 'sensitivity-input',
  context = 'onboarding',
  onNext
}) => {
  React.useEffect(() => {
    const input = document.getElementById(inputId);
    if (input) {
      input.focus();
    }
  }, [inputId]);

  const isPreferences = context === 'preferences';

  return (
    <div className="settings-step">
      {isPreferences ? (
        <>
          <h2>Update sensitivity</h2>
          <p>What in‑game sensitivity do you currently use in {selectedGame || 'your game'}?</p>
        </>
      ) : (
        <>
          <h2>Set your sensitivity</h2>
          <p>What in‑game sensitivity do you use in {selectedGame || 'your game'}?</p>
        </>
      )}

      <div className="form-group">
        <label htmlFor={inputId}>In‑Game Sensitivity</label>
        <input
          id={inputId}
          type="text"
          value={sensitivity}
          onChange={e => onDataChange('sensitivity', e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && sensitivity && onNext) {
              const num = parseFloat(sensitivity);
              if (!isNaN(num) && num > 0) {
                onNext();
              }
            }
          }}
          placeholder="0.35"
          required
        />
      </div>
    </div>
  );
};
