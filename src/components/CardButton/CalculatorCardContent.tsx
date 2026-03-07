import React from 'react';
import { SensitivityCalculator } from '../SensitivityCalculator';
import type { GameData } from '../../types/app';

export interface CalculatorState {
  fromGame: GameData | null;
  toGame: GameData | null;
  fromSensitivity: string;
  fromDpi: string;
  convertedSensitivity: number;
  eDpi: number;
  inches360: number;
  cm360: number;
}

export interface CalculatorCardContentProps {
  games: GameData[];
  calculatorState: CalculatorState;
  onCalculatorStateChange: (state: CalculatorState) => void;
}

/**
 * Card content that wraps the sensitivity calculator (convert from one game to another).
 */
export const CalculatorCardContent: React.FC<CalculatorCardContentProps> = ({
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
