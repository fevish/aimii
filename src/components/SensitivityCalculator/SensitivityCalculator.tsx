import React, { useState, useEffect, useCallback } from 'react';
import { GameData } from '../../data/games.data';
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';
import { formatSensitivity } from '../../utils/format';
import './SensitivityCalculator.css';

interface SensitivityCalculatorProps {
  gamesData: GameData[];
  initialState?: {
    fromGame: GameData | null;
    toGame: GameData | null;
    fromSensitivity: string;
    fromDpi: string;
    convertedSensitivity: number;
    eDpi: number;
    inches360: number;
    cm360: number;
  };
  onStateChange?: (newState: any) => void;
}

export const SensitivityCalculator: React.FC<SensitivityCalculatorProps> = ({
  gamesData,
  initialState,
  onStateChange
}) => {
  const [fromGame, setFromGame] = useState<GameData | null>(initialState?.fromGame || null);
  const [toGame, setToGame] = useState<GameData | null>(initialState?.toGame || null);
  const [fromSensitivity, setFromSensitivity] = useState<string>(initialState?.fromSensitivity || '');
  const [fromDpi, setFromDpi] = useState<string>(initialState?.fromDpi || '');
  const [toDpi, setToDpi] = useState<string>('');
  const [convertedSensitivity, setConvertedSensitivity] = useState<number>(initialState?.convertedSensitivity || 0);
  const [eDpi, setEDpi] = useState<number>(initialState?.eDpi || 0);
  const [inches360, setInches360] = useState<number>(initialState?.inches360 || 0);
  const [cm360, setCm360] = useState<number>(initialState?.cm360 || 0);

  // Filter enabled games for selection
  const enabledGames = gamesData.filter(game => game.enable_for_app);

  // Convert games to SearchableSelect options format
  const gameOptions = enabledGames.map(game => ({
    value: game.game,
    label: game.game
  }));

  // Debounced sensitivity calculation
  const debouncedCalculateSensitivity = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (fromGame: any, toGame: any, fromSensitivity: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (!fromGame || !toGame || !fromSensitivity) {
            setConvertedSensitivity(0);
            return;
          }

          const fromSens = parseFloat(fromSensitivity);
          if (isNaN(fromSens)) {
            return;
          }

          // Calculate sensitivity conversion (DPI independent)
          let convertedSens: number;
          let cm360From: number;

          // For sensitivity conversion, we need to use a standard DPI to normalize the conversion
          // This ensures the conversion is consistent regardless of user's DPI input
          const standardDpi = 800;

          // First, calculate cm/360 from the "from" game using standard DPI
          if (fromGame.specialConversion && fromGame.conversionParams) {
            const params = fromGame.conversionParams;

            if (params.linearCoefficient && params.offset && params.multiplier) {
              // Battlefield-style: ((linearCoefficient * sensitivity + offset) * multiplier) * dpi
              const inches360 = 360 / (((params.linearCoefficient * fromSens + params.offset) * params.multiplier) * standardDpi);
              cm360From = inches360 * 2.54;
            } else if (params.constant && params.offset) {
              // GTA5-style: constant / (dpi * (sensitivity + offset))
              const inches360 = params.constant / (standardDpi * (fromSens + params.offset));
              cm360From = inches360 * 2.54;
            } else {
              // Fallback to standard calculation
              const inches360 = 360 / (fromGame.scalingFactor * fromSens * standardDpi);
              cm360From = inches360 * 2.54;
            }
          } else {
            // Standard calculation
            const inches360 = 360 / (fromGame.scalingFactor * fromSens * standardDpi);
            cm360From = inches360 * 2.54;
          }

          // Now convert from cm/360 to the "to" game sensitivity using standard DPI
          if (toGame.specialConversion && toGame.conversionParams) {
            const params = toGame.conversionParams;
            const inches360 = cm360From / 2.54;

            if (params.linearCoefficient && params.offset && params.multiplier) {
              // Battlefield-style inverse
              convertedSens = ((360 / (inches360 * params.multiplier)) - params.offset) / params.linearCoefficient;
            } else if (params.constant && params.offset) {
              // GTA5-style inverse
              convertedSens = (params.constant / (standardDpi * inches360)) - params.offset;
            } else {
              // Fallback to standard calculation
              convertedSens = 360 / (toGame.scalingFactor * standardDpi * inches360);
            }
          } else {
            // Standard calculation
            const inches360 = cm360From / 2.54;
            convertedSens = 360 / (toGame.scalingFactor * standardDpi * inches360);
          }

          setConvertedSensitivity(convertedSens);
          console.log('Calculated Sensitivity:', {
            fromGame: fromGame?.game,
            fromSens: formatSensitivity(fromSens),
            toGame: toGame?.game,
            toSens: formatSensitivity(convertedSens)
          });
        }, 700); // 300ms debounce delay
      };
    })(),
    []
  );

  // Trigger debounced calculation when inputs change
  useEffect(() => {
    debouncedCalculateSensitivity(fromGame, toGame, fromSensitivity);
  }, [fromGame, toGame, fromSensitivity, debouncedCalculateSensitivity]);

    // Debounced DPI calculation
  const debouncedCalculateDpi = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (fromGame: any, toGame: any, fromSensitivity: string, fromDpi: string, convertedSensitivity: number) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          if (!fromGame || !toGame || !fromSensitivity || !convertedSensitivity) {
            setEDpi(0);
            setInches360(0);
            setCm360(0);
            return;
          }

          const fromSens = parseFloat(fromSensitivity);
          const fromDpiNum = parseFloat(fromDpi);

          if (isNaN(fromSens) || isNaN(fromDpiNum)) {
            setEDpi(0);
            setInches360(0);
            setCm360(0);
            return;
          }

          // Calculate cm/360 using the user's actual DPI
          let cm360WithUserDpi: number;

          if (fromGame.specialConversion && fromGame.conversionParams) {
            const params = fromGame.conversionParams;
            let inches360: number;

            if (params.linearCoefficient && params.offset && params.multiplier) {
              inches360 = 360 / (((params.linearCoefficient * fromSens + params.offset) * params.multiplier) * fromDpiNum);
            } else if (params.constant && params.offset) {
              inches360 = params.constant / (fromDpiNum * (fromSens + params.offset));
            } else {
              inches360 = 360 / (fromGame.scalingFactor * fromSens * fromDpiNum);
            }
            cm360WithUserDpi = inches360 * 2.54;
          } else {
            const inches360 = 360 / (fromGame.scalingFactor * fromSens * fromDpiNum);
            cm360WithUserDpi = inches360 * 2.54;
          }

          setEDpi(convertedSensitivity * fromDpiNum);
          setInches360(cm360WithUserDpi / 2.54);
          setCm360(cm360WithUserDpi);

          console.log('Calculated from DPI:', {
            fromSens: formatSensitivity(fromSens),
            toSens: formatSensitivity(convertedSensitivity),
            eDpi: convertedSensitivity * fromDpiNum,
            cm360: cm360WithUserDpi
          });
        }, 700); // 700ms debounce delay (same as sensitivity)
      };
    })(),
    []
  );

  // Trigger debounced DPI calculation when inputs change
  useEffect(() => {
    debouncedCalculateDpi(fromGame, toGame, fromSensitivity, fromDpi, convertedSensitivity);
  }, [fromGame, toGame, fromSensitivity, fromDpi, convertedSensitivity, debouncedCalculateDpi]);

  // Notify parent of state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        fromGame,
        toGame,
        fromSensitivity,
        fromDpi,
        convertedSensitivity,
        eDpi,
        inches360,
        cm360
      });
    }
  }, [fromGame, toGame, fromSensitivity, fromDpi, convertedSensitivity, eDpi, inches360, cm360, onStateChange]);

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
    setFromDpi('');
    setToDpi('');
    setConvertedSensitivity(0);
    setEDpi(0);
    setInches360(0);
    setCm360(0);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(convertedSensitivity.toFixed(4));
  };

  // Keyboard navigation handlers
  const handleFromGameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && fromGame) {
      e.preventDefault();
      // Focus the "to game" select
      const toGameSelect = document.getElementById('to-game-select');
      toGameSelect?.focus();
    }
  };

  const handleToGameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && toGame) {
      e.preventDefault();
      // Focus the sensitivity input
      const sensitivityInput = document.getElementById('sensitivity-input');
      sensitivityInput?.focus();
    }
  };

  const handleSensitivityKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && fromSensitivity) {
      e.preventDefault();
      // Focus the DPI input
      const dpiInput = document.getElementById('dpi-input');
      dpiInput?.focus();
    }
  };

  const handleDpiKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && fromDpi) {
      e.preventDefault();
      // Focus the first game select (for next conversion)
      const fromGameSelect = document.getElementById('from-game-select');
      fromGameSelect?.focus();
    }
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
            onKeyDown={handleFromGameKeyDown}
          />
        </div>

        <div className="game-input">
          <label>Convert To</label>
          <SearchableSelect
            id="to-game-select"
            value={toGame?.game || ''}
            options={gameOptions}
            placeholder="Select game"
            onChange={handleToGameChange}
            onKeyDown={handleToGameKeyDown}
          />
        </div>

        <div className="game-input">
          <label>Sensitivity (From Game)</label>
          <input
            id="sensitivity-input"
            type="text"
            placeholder="0.27"
            value={fromSensitivity}
            onChange={(e) => setFromSensitivity(e.target.value)}
            onKeyDown={handleSensitivityKeyDown}
          />
        </div>

        <div className="game-input">
          <label>Mouse DPI</label>
          <input
            id="dpi-input"
            type="text"
            placeholder="800"
            value={fromDpi}
            onChange={(e) => setFromDpi(e.target.value)}
            onKeyDown={handleDpiKeyDown}
          />
        </div>
      </div>

      {/* Sensitivity and DPI Inputs */}
      <div className="sensitivity-inputs">

        {/* <div className="input-group">
          <label>To DPI</label>
          <input
            type="number"
            value={toDpi}
            onChange={(e) => setToDpi(e.target.value)}
          />
        </div> */}
      </div>


      <div className="results-container">

        <div className="main-setting">
          <div className="setting-row">
            <p>// Converted Sens {toGame && `(${toGame.game})`}</p>
            <span className="setting-value">{convertedSensitivity ? formatSensitivity(convertedSensitivity) : '0' }</span>
          </div>
        </div>
        {/* Results */}
        <div className="results">

          <div className="settings-grid">
            <div className="setting-row">
              <span className="setting-label">eDPI</span>
              <span className="setting-value">{eDpi ? eDpi.toFixed(0) : '-'}</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">Mouse Travel (cm/360°)</span>
              <span className="setting-value">{cm360 ? cm360.toFixed(1) : '-'}</span>
            </div>
            {/* <div className="setting-row">
              <button className="reset-button" onClick={handleReset}>
                Reset
              </button>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};