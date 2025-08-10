import React from 'react';

interface DpiInputStepProps {
  dpi: string;
  onDataChange: (field: string, value: string) => void;
  inputId?: string;
  context?: 'onboarding' | 'preferences';
  onNext?: () => void;
}

export const DpiInputStep: React.FC<DpiInputStepProps> = ({
  dpi,
  onDataChange,
  inputId = 'dpi-input',
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
          <h2>Update your DPI</h2>
          <p>Adjust your baseline without changing your feel.</p>
        </>
      ) : (
        <div className="welcome-message" hidden>
          <h2>Welcome to aimii</h2>
          <p>To get started, let's lock in your mouse travel distance (cm/360°).</p>
        </div>
      )}
      {!isPreferences &&
      <>
        <h2>What is your current DPI?</h2>
        <p>Enter your DPI setting.</p>
      </>
      }

      <div className="form-group">
        <label htmlFor={inputId}>Mouse DPI</label>
        <input
          id={inputId}
          type="text"
          value={dpi}
          onChange={e => onDataChange('dpi', e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && dpi && onNext) {
              const num = parseInt(dpi);
              if (!isNaN(num) && num > 0) {
                onNext();
              }
            }
          }}
          placeholder="800"
          required
        />
      </div>
    </div>
  );
};
