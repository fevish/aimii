import React, { useState, useEffect } from 'react';
import { OverwolfTerminal } from '../OverwolfTerminal/OverwolfTerminal';
import './MyMainWindow.css';

interface GameData {
  game: string;
  sensitivityScalingFactor: number;
  owGameId: string;
  owConstant: string;
  owGameName: string;
  enable_for_app: boolean;
}

interface CanonicalSettings {
  game: string;
  sensitivity: number;
  dpi: number;
}

declare global {
  interface Window {
    games: {
      getAllGames: () => Promise<GameData[]>;
      getEnabledGames: () => Promise<GameData[]>;
      getGameSummary: () => Promise<string>;
      getEnabledGameIds: () => Promise<number[]>;
    };
    settings: {
      getCanonicalSettings: () => Promise<CanonicalSettings | null>;
      setCanonicalSettings: (game: string, sensitivity: number, dpi: number) => Promise<boolean>;
      hasCanonicalSettings: () => Promise<boolean>;
    };
  }
}

export const MyMainWindow: React.FC = () => {
  const [games, setGames] = useState<GameData[]>([]);
  const [canonicalSettings, setCanonicalSettings] = useState<CanonicalSettings | null>(null);
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [sensitivity, setSensitivity] = useState<string>('');
  const [dpi, setDpi] = useState<string>('800');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadGames();
    loadCanonicalSettings();
  }, []);

  const loadGames = async () => {
    try {
      const enabledGames = await window.games.getEnabledGames();
      setGames(enabledGames.sort((a, b) => a.game.localeCompare(b.game)));
    } catch (error) {
      console.error('Error loading games:', error);
      setMessage('Error loading games data');
    }
  };

  const loadCanonicalSettings = async () => {
    try {
      const settings = await window.settings.getCanonicalSettings();
      if (settings) {
        setCanonicalSettings(settings);
        setSelectedGame(settings.game);
        setSensitivity(settings.sensitivity.toString());
        setDpi(settings.dpi.toString());
      }
    } catch (error) {
      console.error('Error loading canonical settings:', error);
    }
  };

  const handleSaveCanonicalSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedGame || !sensitivity || !dpi) {
      setMessage('Please fill in all fields');
      return;
    }

    const sensitivityNum = parseFloat(sensitivity);
    const dpiNum = parseInt(dpi);

    if (isNaN(sensitivityNum) || sensitivityNum <= 0) {
      setMessage('Please enter a valid sensitivity value');
      return;
    }

    if (isNaN(dpiNum) || dpiNum <= 0) {
      setMessage('Please enter a valid DPI value');
      return;
    }

    setIsLoading(true);
    try {
      await window.settings.setCanonicalSettings(selectedGame, sensitivityNum, dpiNum);
      setCanonicalSettings({ game: selectedGame, sensitivity: sensitivityNum, dpi: dpiNum });
      setMessage('Canonical settings saved successfully!');
    } catch (error) {
      console.error('Error saving canonical settings:', error);
      setMessage('Error saving settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="my-main-window">
      <header className="app-header">
        <h1>AIMII - Mouse Sensitivity Converter</h1>
        <p>Convert your mouse sensitivity between different games and devices</p>
      </header>

      <main className="app-content">
        <section className="canonical-settings-section">
          <h2>Canonical Game Settings</h2>
          <p>Set your preferred game, sensitivity, and DPI as your baseline for conversions.</p>

          {canonicalSettings && (
            <div className="current-settings">
              <h3>Current Settings:</h3>
              <p><strong>Game:</strong> {canonicalSettings.game}</p>
              <p><strong>Sensitivity:</strong> {canonicalSettings.sensitivity}</p>
              <p><strong>DPI:</strong> {canonicalSettings.dpi}</p>
            </div>
          )}

          <form onSubmit={handleSaveCanonicalSettings} className="canonical-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="game-select">Preferred Game:</label>
                <select
                  id="game-select"
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  required
                >
                  <option value="">Select your preferred game</option>
                  {games.map((game) => (
                    <option key={game.game} value={game.game}>
                      {game.game}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="sensitivity-input">In-Game Sensitivity:</label>
                <input
                  id="sensitivity-input"
                  type="number"
                  step="any"
                  min="0.001"
                  value={sensitivity}
                  onChange={(e) => setSensitivity(e.target.value)}
                  placeholder="Enter your sensitivity"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="dpi-input">Mouse DPI:</label>
                <input
                  id="dpi-input"
                  type="number"
                  min="1"
                  value={dpi}
                  onChange={(e) => setDpi(e.target.value)}
                  placeholder="Enter your mouse DPI"
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="save-button">
              {isLoading ? 'Saving...' : 'Save Canonical Settings'}
            </button>
          </form>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </section>

        <section className="debug-section">
          <h3>Development Console</h3>
          <OverwolfTerminal />
        </section>
      </main>
    </div>
  );
};