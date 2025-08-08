import React from 'react';

interface GameSelectionStepProps {
  games: Array<{ game: string }>;
  selectedGame: string;
  onDataChange: (field: string, value: string) => void;
  inputId?: string;
  context?: 'onboarding' | 'preferences';
  onNext?: () => void;
}

export const GameSelectionStep: React.FC<GameSelectionStepProps> = ({
  games,
  selectedGame,
  onDataChange,
  inputId = 'game-select',
  context = 'onboarding',
  onNext
}) => {
  const isPreferences = context === 'preferences';

  React.useEffect(() => {
    const el = document.getElementById(inputId) as HTMLSelectElement | null;
    if (el) el.focus();
  }, [inputId]);

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
        <div className="select-wrapper">
        <select
          id={inputId}
          value={selectedGame}
          onChange={e => onDataChange('selectedGame', e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && selectedGame && onNext) {
              onNext();
            }
          }}
          required
        >
          <option value="" disabled>Select a game</option>
          {games.map(g => (
            <option key={g.game} value={g.game}>{g.game}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
