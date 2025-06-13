import React from 'react';
import './Widget.css';

export const Widget: React.FC = () => {
  return (
    <div className="widget">
      <div className="widget-header">
        <h2>AIMII Widget</h2>
      </div>
      <div className="widget-content">
        <h3>In Game Widget</h3>
        <p>Sensitivity converter overlay</p>
        <div className="widget-placeholder">
          <p>🎮 Game detected!</p>
          <p>Press Ctrl+Shift+W to toggle</p>
        </div>
      </div>
    </div>
  );
};