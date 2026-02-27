import React from 'react';
import { SensitivityCalculator } from '../SensitivityCalculator';
import type { GameData } from '../../types/app';

interface SecondaryCardContentProps {
  games: GameData[];
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
  games,
  calculatorState,
  onCalculatorStateChange
}) => {
  return (
    <SensitivityCalculator
      gamesData={games}
      initialState={calculatorState}
      onStateChange={onCalculatorStateChange}
    />
  );
};
