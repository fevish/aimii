import React from 'react';

interface EdpiChoiceStepProps {
  onChoice: (knows: boolean) => void;
}

export const EdpiChoiceStep: React.FC<EdpiChoiceStepProps> = ({ onChoice }) => {
  return (
    <div className="settings-step">
      <h2>Let's get started!</h2>
      <p>Do you know your eDPI?</p>

      <div className="choice-buttons">
        <button
          className="btn btn-primary"
          onClick={() => onChoice(true)}
        >
          Yes, I know my eDPI
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => onChoice(false)}
        >
          No, help me set it!
        </button>
      </div>
    </div>
  );
};