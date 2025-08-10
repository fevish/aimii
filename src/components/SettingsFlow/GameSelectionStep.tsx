import React from 'react';
import { GameData } from '../../types/app';
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';

interface GameSelectionStepProps {
  games: GameData[];
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
    const el = document.getElementById(inputId) as HTMLInputElement | null;
    if (el) el.focus();
  }, [inputId]);

  // Convert games to options format for SearchableSelect
  const gameOptions = games.map(game => ({
    value: game.game,
    label: game.game
  }));

  const handleGameChange = (value: string) => {
    onDataChange('selectedGame', value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedGame && onNext) {
      onNext();
    }
  };

  return (
    <div className="settings-step">
      {isPreferences ? (
        <>
          <h2>Reference game</h2>
          <p>Choose a game to establish your baseline.</p>
        </>
      ) : (
        <>
          <h2>Set a reference game</h2>
          <p>Choose a game to establish your baseline.</p>
        </>
      )}

      <div className="form-group">
        <label htmlFor={inputId}>Game</label>
        <SearchableSelect
          id={inputId}
          value={selectedGame}
          options={gameOptions}
          placeholder="Select a game"
          onChange={handleGameChange}
          onKeyDown={handleKeyDown}
          required
        />
      </div>
    </div>
  );
};
