import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { GameData } from '../../types/app';
import { calculateCm360, calculateTargetSensitivity } from '../../utils/sensitivity-conversion';
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';
import { formatSensitivity } from '../../utils/format';
import './SensitivityCalculator.css';

interface SensitivityCalculatorProps {
  gamesData: GameData[];
  /** Game name from user preferences; when selected, shown as "User Setting (GameName)" */
  userPreferenceGameName?: string | null;
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

const USER_SETTING_VALUE = '__user_setting__';

export const SensitivityCalculator: React.FC<SensitivityCalculatorProps> = ({
  gamesData,
  userPreferenceGameName = null,
  initialState,
  onStateChange
}) => {
  const [fromGameValue, setFromGameValue] = useState<string>(() =>
    userPreferenceGameName && initialState?.fromGame?.game === userPreferenceGameName
      ? USER_SETTING_VALUE
      : (initialState?.fromGame?.game || '')
  );
  const [toGameValue, setToGameValue] = useState<string>(() =>
    userPreferenceGameName && initialState?.toGame?.game === userPreferenceGameName
      ? USER_SETTING_VALUE
      : (initialState?.toGame?.game || '')
  );
  const [fromSensitivity, setFromSensitivity] = useState<string>(initialState?.fromSensitivity || '');
  const [fromDpi, setFromDpi] = useState<string>(initialState?.fromDpi || '');
  const [toDpi, setToDpi] = useState<string>('');
  const [convertedSensitivity, setConvertedSensitivity] = useState<number>(initialState?.convertedSensitivity || 0);
  const [eDpi, setEDpi] = useState<number>(initialState?.eDpi || 0);
  const [inches360, setInches360] = useState<number>(initialState?.inches360 || 0);
  const [cm360, setCm360] = useState<number>(initialState?.cm360 || 0);
  const [displayedValue, setDisplayedValue] = useState<number>(initialState?.convertedSensitivity || 0);
  const rafRef = useRef<number | null>(null);
  const lastValueRef = useRef(displayedValue);
  lastValueRef.current = displayedValue;

  const enabledGames = gamesData.filter(game => game.enable_for_app);

  const userPreferenceGame = userPreferenceGameName
    ? enabledGames.find(g => g.game === userPreferenceGameName) ?? null
    : null;
  const actualFromGame: GameData | null =
    fromGameValue === USER_SETTING_VALUE
      ? userPreferenceGame
      : (enabledGames.find(g => g.game === fromGameValue) ?? null);
  const actualToGame: GameData | null =
    toGameValue === USER_SETTING_VALUE
      ? userPreferenceGame
      : (enabledGames.find(g => g.game === toGameValue) ?? null);

  const gameOptions = enabledGames.map(game => ({ value: game.game, label: game.game }));
  const fromGameOptions = userPreferenceGameName
    ? [{ value: USER_SETTING_VALUE, label: `User Setting (${userPreferenceGameName})` }, ...gameOptions]
    : gameOptions;
  const toGameOptions = userPreferenceGameName
    ? [{ value: USER_SETTING_VALUE, label: `User Setting (${userPreferenceGameName})` }, ...gameOptions]
    : gameOptions;

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

          const standardDpi = 800;
          const cm360From = calculateCm360(fromGame, fromSens, standardDpi);
          const convertedSens = calculateTargetSensitivity(toGame, cm360From, standardDpi);
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

  useEffect(() => {
    debouncedCalculateSensitivity(actualFromGame, actualToGame, fromSensitivity);
  }, [actualFromGame, actualToGame, fromSensitivity, debouncedCalculateSensitivity]);

  // Animate displayed value when converted result changes (ease-in-out)
  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const from = lastValueRef.current;
    const to = convertedSensitivity;
    const range = to - from;
    if (Math.abs(range) < 0.0001) {
      setDisplayedValue(to);
      return;
    }
    const duration = 1000;
    const start = performance.now();
    const easeInOut = (t: number) => t * t * (3 - 2 * t); // smoothstep
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      setDisplayedValue(from + range * easeInOut(t));
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [convertedSensitivity]);

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

          const cm360WithUserDpi = calculateCm360(fromGame, fromSens, fromDpiNum);
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

  useEffect(() => {
    debouncedCalculateDpi(actualFromGame, actualToGame, fromSensitivity, fromDpi, convertedSensitivity);
  }, [actualFromGame, actualToGame, fromSensitivity, fromDpi, convertedSensitivity, debouncedCalculateDpi]);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        fromGame: actualFromGame,
        toGame: actualToGame,
        fromSensitivity,
        fromDpi,
        convertedSensitivity,
        eDpi,
        inches360,
        cm360
      });
    }
  }, [actualFromGame, actualToGame, fromSensitivity, fromDpi, convertedSensitivity, eDpi, inches360, cm360, onStateChange]);

  const handleFromGameChange = (value: string) => setFromGameValue(value);
  const handleToGameChange = (value: string) => setToGameValue(value);

  const handleSwapGames = () => {
    setFromGameValue(toGameValue);
    setToGameValue(fromGameValue);
  };

  const handleReset = () => {
    setFromGameValue('');
    setToGameValue('');
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
    if (e.key === 'Enter' && actualFromGame) {
      e.preventDefault();
      // Focus the "to game" select
      const toGameSelect = document.getElementById('to-game-select');
      toGameSelect?.focus();
    }
  };

  const handleToGameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && actualToGame) {
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
            value={fromGameValue}
            options={fromGameOptions}
            placeholder="Select game"
            onChange={handleFromGameChange}
            onKeyDown={handleFromGameKeyDown}
          />
        </div>

        <div className="game-input">
          <label>Convert To</label>
          <SearchableSelect
            id="to-game-select"
            value={toGameValue}
            options={toGameOptions}
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
            <h3 className="heading">// Converted Sens {actualToGame ? `for ${toGameValue === USER_SETTING_VALUE ? `User Setting (${actualToGame.game})` : actualToGame.game}` : 'for.. (Select game)'}</h3>
            <p className="value-large">{displayedValue ? formatSensitivity(displayedValue) : '0'}</p>
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
              <span className="setting-label">Mouse Travel cm/360°</span>
              <span className="setting-value">{cm360 ? cm360.toFixed(3) : '—'}</span>
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