import React from 'react';

interface DpiInputStepProps {
  dpi: string;
  onDataChange: (field: string, value: string) => void;
  onNext: () => void;
  inputId?: string;
  context?: 'onboarding' | 'preferences';
}

export const DpiInputStep: React.FC<DpiInputStepProps> = ({
  dpi,
  onDataChange,
  onNext,
  inputId = 'dpi-input',
  context = 'onboarding'
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
          <p>To get started, let's lock in your true sensitivity.</p>
        </div>
      )}
      {!isPreferences &&
      <>
        <h3>What is your current DPI?</h3>
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
            if (e.key === 'Enter' && dpi) {
              onNext();
            }
          }}
          placeholder="800"
          required
        />
      </div>
    </div>
  );
};
