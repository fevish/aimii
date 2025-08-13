import React, { useState, useEffect } from 'react';
import { GameData } from '../../data/games.data';
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';
import './SensitivityCalculator.css';

interface SensitivityCalculatorProps {
  gamesData: GameData[];
}

export const SensitivityCalculator: React.FC<SensitivityCalculatorProps> = ({ gamesData }) => {
  const [fromGame, setFromGame] = useState<GameData | null>(null);
  const [toGame, setToGame] = useState<GameData | null>(null);
  const [fromSensitivity, setFromSensitivity] = useState<string>('');
  const [fromDpi, setFromDpi] = useState<string>('800');
  const [toDpi, setToDpi] = useState<string>('800');
  const [convertedSensitivity, setConvertedSensitivity] = useState<number>(0);
  const [eDpi, setEDpi] = useState<number>(0);
  const [inches360, setInches360] = useState<number>(0);
  const [cm360, setCm360] = useState<number>(0);

  // Filter enabled games for selection
  const enabledGames = gamesData.filter(game => game.enable_for_app);

  // Convert games to SearchableSelect options format
  const gameOptions = enabledGames.map(game => ({
    value: game.game,
    label: game.game
  }));

  // Calculate conversion when inputs change
  useEffect(() => {
    if (!fromGame || !toGame || !fromSensitivity || !fromDpi || !toDpi) {
      setConvertedSensitivity(0);
      setEDpi(0);
      setInches360(0);
      setCm360(0);
      return;
    }

    const fromSens = parseFloat(fromSensitivity);
    const fromDpiNum = parseFloat(fromDpi);
    const toDpiNum = parseFloat(toDpi);

    if (isNaN(fromSens) || isNaN(fromDpiNum) || isNaN(toDpiNum)) {
      return;
    }

    // Calculate cm/360 for the "from" game
    let cm360From: number;

    if (fromGame.specialConversion && fromGame.conversionParams) {
      // Use special conversion parameters
      const params = fromGame.conversionParams;
      let inches360: number;

      if (params.linearCoefficient && params.offset && params.multiplier) {
        // Battlefield-style conversion
        inches360 = 360 / (((params.linearCoefficient * fromSens + params.offset) * params.multiplier) * fromDpiNum);
      } else if (params.constant && params.offset) {
        // GTA5-style conversion
        inches360 = params.constant / (fromDpiNum * (fromSens + params.offset));
      } else {
        // Fallback to standard conversion
        inches360 = 360 / (fromSens * fromDpiNum);
      }

      cm360From = inches360 * 2.54;
    } else {
      // Standard conversion
      const inches360 = 360 / (fromSens * fromDpiNum);
      cm360From = inches360 * 2.54;
    }

    // Calculate sensitivity for the "to" game
    let convertedSens: number;

    if (toGame.specialConversion && toGame.conversionParams) {
      // Use special conversion parameters in reverse
      const params = toGame.conversionParams;
      let inches360: number;

      if (params.linearCoefficient && params.offset && params.multiplier) {
        // Battlefield-style conversion (reverse)
        inches360 = cm360From / 2.54;
        convertedSens = ((360 / (inches360 * fromDpiNum)) - params.offset) / params.linearCoefficient / params.multiplier;
      } else if (params.constant && params.offset) {
        // GTA5-style conversion (reverse)
        inches360 = cm360From / 2.54;
        convertedSens = (params.constant / (fromDpiNum * inches360)) - params.offset;
      } else {
        // Fallback to standard conversion
        convertedSens = 360 / (cm360From / 2.54 * toDpiNum);
      }
    } else {
      // Standard conversion
      const inches360 = cm360From / 2.54;
      convertedSens = 360 / (inches360 * toDpiNum);
    }

    setConvertedSensitivity(convertedSens);
    setEDpi(convertedSens * toDpiNum);
    setInches360(cm360From / 2.54);
    setCm360(cm360From);
  }, [fromGame, toGame, fromSensitivity, fromDpi, toDpi]);

  const handleFromGameChange = (gameName: string) => {
    const game = enabledGames.find(g => g.game === gameName);
    setFromGame(game || null);
  };

  const handleToGameChange = (gameName: string) => {
    const game = enabledGames.find(g => g.game === gameName);
    setToGame(game || null);
  };

  const handleSwapGames = () => {
    setFromGame(toGame);
    setToGame(fromGame);
  };

  const handleReset = () => {
    setFromGame(null);
    setToGame(null);
    setFromSensitivity('');
    setFromDpi('800');
    setToDpi('800');
    setConvertedSensitivity(0);
    setEDpi(0);
    setInches360(0);
    setCm360(0);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(convertedSensitivity.toFixed(4));
  };

  return (
    <div className="sensitivity-calculator">
      {/* Game Selection */}
      <div className="game-selection">
        <div className="game-input">
          <label>Convert From</label>
          <SearchableSelect
            id="from-game-select"
            value={fromGame?.game || ''}
            options={gameOptions}
            placeholder="Select game"
            onChange={handleFromGameChange}
          />
        </div>

        {/* <button className="swap-button" onClick={handleSwapGames}>
          ⇄
        </button> */}

        <div className="game-input">
          <label>Convert To</label>
          <SearchableSelect
            id="to-game-select"
            value={toGame?.game || ''}
            options={gameOptions}
            placeholder="Select game"
            onChange={handleToGameChange}
          />
        </div>
      </div>

      {/* Sensitivity and DPI Inputs */}
      <div className="sensitivity-inputs">
        <div className="input-group">
          <label>From Sensitivity</label>
          <input
            type="text"
            placeholder="0.27"
            value={fromSensitivity}
            onChange={(e) => setFromSensitivity(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label>Mouse DPI</label>
          <input
            type="number"
            value={fromDpi}
            onChange={(e) => setFromDpi(e.target.value)}
          />
        </div>

        {/* <div className="input-group">
          <label>To DPI</label>
          <input
            type="number"
            value={toDpi}
            onChange={(e) => setToDpi(e.target.value)}
          />
        </div> */}
      </div>

      {/* Results */}
      <div className="results">
        <div className="main-setting">
          <div className="setting-row">
              {/* <button onClick={copyToClipboard} className="copy-button">
                Copy
              </button> */}
            <span className="">{convertedSensitivity.toFixed(4)}</span>
          </div>
        </div>

        <div className="settings-grid">
          <div className="setting-row">
            <span className="setting-label">eDPI</span>
            <span className="setting-value">{eDpi.toFixed(2)}</span>
          </div>
          <div className="setting-row">
            <span className="setting-label">Cm/360°</span>
            <span className="setting-value">{cm360.toFixed(2)}</span>
          </div>
          <div className="setting-row">
            <button className="reset-button" onClick={handleReset}>
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};