import React from 'react';

interface GameData {
  game: string;
  sensitivityScalingFactor: number;
  owGameId: string;
  owConstant?: string;
  owGameName?: string;
  enable_for_app: boolean;
}

interface GameSelectionStepProps {
  games: GameData[];
  selectedGame: string;
  onDataChange: (field: string, value: string) => void;
  inputId?: string;
}

export const GameSelectionStep: React.FC<GameSelectionStepProps> = ({
  games,
  selectedGame,
  onDataChange,
  inputId = 'game-select'
}) => {
  React.useEffect(() => {
    const select = document.getElementById(inputId);
    if (select) {
      select.focus();
    }
  }, [inputId]);

  return (
    <div className="settings-step">
      <h2>Choose your eDPI</h2>
      <p>Don't know your eDPI? Select your most played game below.</p>

      <div className="form-group">
        <label htmlFor={inputId}>Select your most played game</label>
        <div className="select-wrapper">
          <select
            id={inputId}
            value={selectedGame}
            onChange={(e) => onDataChange('selectedGame', e.target.value)}
            required
          >
            <option value="">Select a Game</option>
            {games.map((game) => (
              <option key={game.game} value={game.game}>
                {game.game}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};