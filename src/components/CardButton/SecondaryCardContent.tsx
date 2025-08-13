import React from 'react';
import { SensitivityCalculator } from '../SensitivityCalculator';
import { gamesData } from '../../data/games.data';
import { GameData } from '../../data/games.data';

interface SecondaryCardContentProps {
  calculatorState: {
    fromGame: GameData | null;
    toGame: GameData | null;
    fromSensitivity: string;
    fromDpi: string;
    convertedSensitivity: number;
    eDpi: number;
    inches360: number;
    cm360: number;
  };
  onCalculatorStateChange: (newState: any) => void;
}

export const SecondaryCardContent: React.FC<SecondaryCardContentProps> = ({
  calculatorState,
  onCalculatorStateChange
}) => {
  return (
    <SensitivityCalculator
      gamesData={gamesData}
      initialState={calculatorState}
      onStateChange={onCalculatorStateChange}
    />
  );
};
