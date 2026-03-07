import React, { forwardRef } from 'react';
import './FpsCounter.css';

export const FpsCounter = forwardRef<HTMLDivElement>((_, ref) => {
  return <div ref={ref} className="aim-fps-counter">60</div>;
});

FpsCounter.displayName = 'FpsCounter';
