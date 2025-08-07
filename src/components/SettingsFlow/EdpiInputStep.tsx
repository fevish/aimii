import React from 'react';

interface EdpiInputStepProps {
  edpi: string;
  onDataChange: (field: string, value: string) => void;
  onNext: () => void;
  inputId?: string;
}

export const EdpiInputStep: React.FC<EdpiInputStepProps> = ({
  edpi,
  onDataChange,
  onNext,
  inputId = 'edpi-input'
}) => {
  React.useEffect(() => {
    const input = document.getElementById(inputId);
    if (input) {
      input.focus();
    }
  }, [inputId]);

  return (
    <div className="settings-step">
      <h2>Enter your eDPI</h2>
      <p>Please enter your eDPI value below.</p>

      <div className="form-group">
        <label htmlFor={inputId}>Your eDPI</label>
        <input
          id={inputId}
          type="text"
          value={edpi}
          onChange={e => onDataChange('edpi', e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && edpi) {
              onNext();
            }
          }}
          placeholder="280"
          required
        />
        <small>eDPI = In-Game Sensitivity × Mouse DPI</small>
      </div>
    </div>
  );
};
