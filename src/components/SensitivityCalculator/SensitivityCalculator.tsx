import React, { useState, useEffect, useCallback } from 'react';
import type { GameData } from '../../types/app';
import { calculateCm360, calculateTargetSensitivity } from '../../utils/sensitivity-conversion';
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';
import { formatSensitivity } from '../../utils/format';
import { useAnimatedNumber } from './useAnimatedNumber';
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
    toDpi: string;
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
  const [toGameValue, setToGameValue] = useState<string>(() => initialState?.toGame?.game || '');
  const [fromSensitivity, setFromSensitivity] = useState<string>(initialState?.fromSensitivity || '');
  const [fromDpi, setFromDpi] = useState<string>(initialState?.fromDpi || '');
  const [toDpi, setToDpi] = useState<string>(initialState?.toDpi || '');
  const [convertedSensitivity, setConvertedSensitivity] = useState<number>(initialState?.convertedSensitivity || 0);
  const [eDpi, setEDpi] = useState<number>(initialState?.eDpi || 0);
  const [inches360, setInches360] = useState<number>(initialState?.inches360 || 0);
  const [cm360, setCm360] = useState<number>(initialState?.cm360 || 0);

  // Animated display values (ease toward each new result)
  const displayedSens = useAnimatedNumber(convertedSensitivity);
  const displayedEDpi = useAnimatedNumber(eDpi);
  const displayedCm360 = useAnimatedNumber(cm360);

  const enabledGames = gamesData.filter(game => game.enable_for_app);

  const userPreferenceGame = userPreferenceGameName
    ? enabledGames.find(g => g.game === userPreferenceGameName) ?? null
    : null;
  const actualFromGame: GameData | null =
    fromGameValue === USER_SETTING_VALUE
      ? userPreferenceGame
      : (enabledGames.find(g => g.game === fromGameValue) ?? null);
  const actualToGame: GameData | null = enabledGames.find(g => g.game === toGameValue) ?? null;

  const gameOptions = enabledGames.map(game => ({ value: game.game, label: game.game }));
  const fromGameOptions = userPreferenceGameName
    ? [{ value: USER_SETTING_VALUE, label: `User Setting (${userPreferenceGameName})` }, ...gameOptions]
    : gameOptions;
  const toGameOptions = gameOptions;

  // Debounced conversion: derives every result from the same input snapshot in one pass so the
  // values stay self-consistent (e.g. eDPI = convertedSens × toDPI never flickers on a DPI change).
  const debouncedCalculate = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (fromGame: any, toGame: any, fromSensitivity: string, fromDpi: string, toDpi: string) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const fromSens = parseFloat(fromSensitivity);
          if (!fromGame || !toGame || !fromSensitivity || isNaN(fromSens)) {
            setConvertedSensitivity(0);
            setEDpi(0);
            setInches360(0);
            setCm360(0);
            return;
          }

          const effectiveFromDpi = parseFloat(fromDpi) || 800;
          const effectiveToDpi = parseFloat(toDpi) || effectiveFromDpi;
          const cm360From = calculateCm360(fromGame, fromSens, effectiveFromDpi);
          const convertedSens = calculateTargetSensitivity(toGame, cm360From, effectiveToDpi);

          setConvertedSensitivity(convertedSens);
          setEDpi(convertedSens * effectiveToDpi);
          setCm360(cm360From);
          setInches360(cm360From / 2.54);

          console.log('Calculated conversion:', {
            fromGame: fromGame?.game,
            fromSens: formatSensitivity(fromSens),
            fromDpi: effectiveFromDpi,
            toGame: toGame?.game,
            toSens: formatSensitivity(convertedSens),
            toDpi: effectiveToDpi,
            eDpi: convertedSens * effectiveToDpi,
            cm360: cm360From
          });
        }, 700); // debounce delay
      };
    })(),
    []
  );

  useEffect(() => {
    debouncedCalculate(actualFromGame, actualToGame, fromSensitivity, fromDpi, toDpi);
  }, [actualFromGame, actualToGame, fromSensitivity, fromDpi, toDpi, debouncedCalculate]);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        fromGame: actualFromGame,
        toGame: actualToGame,
        fromSensitivity,
        fromDpi,
        toDpi,
        convertedSensitivity,
        eDpi,
        inches360,
        cm360
      });
    }
  }, [actualFromGame, actualToGame, fromSensitivity, fromDpi, toDpi, convertedSensitivity, eDpi, inches360, cm360, onStateChange]);

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
      // Focus the From DPI input
      const dpiInput = document.getElementById('from-dpi-input');
      dpiInput?.focus();
    }
  };

  const handleFromDpiKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && fromDpi) {
      e.preventDefault();
      // Focus the To DPI input
      const toDpiInput = document.getElementById('to-dpi-input');
      toDpiInput?.focus();
    }
  };

  const handleToDpiKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
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

      </div>

      {/* Sensitivity + DPI inputs in a single row */}
      <div className="value-inputs">
        <div className="game-input">
          <label>Sensitivity</label>
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
          <label>Current DPI</label>
          <input
            id="from-dpi-input"
            type="text"
            placeholder="800"
            value={fromDpi}
            onChange={(e) => setFromDpi(e.target.value)}
            onKeyDown={handleFromDpiKeyDown}
          />
        </div>

        <div className="game-input">
          <label>New DPI (Optional)</label>
          <input
            id="to-dpi-input"
            type="text"
            placeholder={fromDpi || '800'}
            value={toDpi}
            onChange={(e) => setToDpi(e.target.value)}
            onKeyDown={handleToDpiKeyDown}
          />
        </div>
      </div>


      <div className="results-container">

        <div className="main-setting">
          <div className="setting-row">
            <h3 className="heading">// Converted Sens {actualToGame ? `for ${actualToGame.game}` : 'for.. (Select game)'}</h3>
            <p className="value-large">{displayedSens ? formatSensitivity(displayedSens) : '0'}</p>
          </div>
        </div>
        {/* Results */}
        <div className="results">

          <div className="settings-grid">
            <div className="setting-row">
              <span className="setting-label">eDPI</span>
              <span className="setting-value">{eDpi ? displayedEDpi.toFixed(0) : '-'}</span>
            </div>
            <div className="setting-row">
              <span className="setting-label">Mouse Travel cm/360°</span>
              <span className="setting-value">{cm360 ? displayedCm360.toFixed(3) : '—'}</span>
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