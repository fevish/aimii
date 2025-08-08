import React from 'react';

interface GameSelectionStepProps {
  games: Array<{ game: string }>;
  selectedGame: string;
  onDataChange: (field: string, value: string) => void;
  inputId?: string;
  context?: 'onboarding' | 'preferences';
}

export const GameSelectionStep: React.FC<GameSelectionStepProps> = ({
  games,
  selectedGame,
  onDataChange,
  inputId = 'game-select',
  context = 'onboarding'
}) => {
  const isPreferences = context === 'preferences';

  return (
    <div className="settings-step">
      {isPreferences ? (
        <>
          <h2>Reference game</h2>
          <p>Choose the game that reflects your current settings.</p>
        </>
      ) : (
        <>
          <h2>Set a reference game</h2>
          <p>Choose a game to establish your baseline.</p>
        </>
      )}

      <div className="form-group">
        <label htmlFor={inputId}>Favorite Game</label>
        <select
          id={inputId}
          value={selectedGame}
          onChange={e => onDataChange('selectedGame', e.target.value)}
          required
        >
          <option value="" disabled>Select a game</option>
          {games.map(g => (
            <option key={g.game} value={g.game}>{g.game}</option>
          ))}
        </select>
      </div>
    </div>
  );
};
