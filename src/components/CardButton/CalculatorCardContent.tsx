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
  /** Game name from user preferences; shown as "User Setting (GameName)" in calculator */
  userPreferenceGameName?: string | null;
  calculatorState: CalculatorState;
  onCalculatorStateChange: (state: CalculatorState) => void;
}

/**
 * Card content that wraps the sensitivity calculator (convert from one game to another).
 */
export const CalculatorCardContent: React.FC<CalculatorCardContentProps> = ({
  games,
  userPreferenceGameName = null,
  calculatorState,
  onCalculatorStateChange
}) => {
  return (
    <SensitivityCalculator
      gamesData={games}
      userPreferenceGameName={userPreferenceGameName}
      initialState={calculatorState}
      onStateChange={onCalculatorStateChange}
    />
  );
};
