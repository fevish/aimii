import React from 'react';
import { SensitivityCalculator } from '../SensitivityCalculator';
import { gamesData } from '../../data/games.data';

interface SecondaryCardContentProps {
  // Add props as needed for the secondary card
}

export const SecondaryCardContent: React.FC<SecondaryCardContentProps> = () => {
  return (
    <div className="secondary-card-content">
      <SensitivityCalculator gamesData={gamesData} />
    </div>
  );
};
