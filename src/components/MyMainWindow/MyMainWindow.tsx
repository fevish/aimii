import React from 'react';
import { OverwolfTerminal } from '../OverwolfTerminal/OverwolfTerminal';
import './MyMainWindow.css';

export const MyMainWindow: React.FC = () => {
  return (
    <div className="my-main-window">
      <header className="app-header">
        <h1>AIMII - Mouse Sensitivity Converter</h1>
        <p>Convert your mouse sensitivity between different games and devices</p>
      </header>

      <main className="app-content">
        <section className="welcome-section">
          <h2>Welcome to AIMII</h2>
          <p>Your companion for mouse sensitivity conversion across gaming platforms.</p>

          {/* Placeholder for future sensitivity converter UI */}
          <div className="converter-placeholder">
            <p>🚀 Sensitivity converter coming soon!</p>
          </div>
        </section>

        <section className="debug-section">
          <h3>Development Console</h3>
          <OverwolfTerminal />
        </section>
      </main>
    </div>
  );
};