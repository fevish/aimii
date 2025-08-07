import React from 'react';

interface DpiInputStepProps {
  dpi: string;
  onDataChange: (field: string, value: string) => void;
  onNext: () => void;
  inputId?: string;
}

export const DpiInputStep: React.FC<DpiInputStepProps> = ({
  dpi,
  onDataChange,
  onNext,
  inputId = 'dpi-input'
}) => {
  React.useEffect(() => {
    const input = document.getElementById(inputId);
    if (input) {
      input.focus();
    }
  }, [inputId]);

  return (
    <div className="settings-step">
      <h2>What is your mouse DPI?</h2>
      <p>Enter your mouse DPI setting.</p>

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
