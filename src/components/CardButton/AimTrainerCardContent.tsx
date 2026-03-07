import React, { useState, useEffect } from 'react';
import { formatSensitivity } from '../../utils/format';
import { SensitivityConversion } from '../../browser/services/sensitivity-converter.service';
import type { BaselineSettings } from '../../types/app';
import { AIM_TRAINER_DEFAULT_FOV, type AimTrainerConfig } from '../../types/aim-trainer';
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';
import './AimTrainerCardContent.css';

const COMMON_RESOLUTIONS = [
  { width: 1920, height: 1080, label: '1920 × 1080 (Full HD)' },
  { width: 2560, height: 1440, label: '2560 × 1440 (QHD)' },
  { width: 3840, height: 2160, label: '3840 × 2160 (4K)' },
  { width: 1280, height: 720, label: '1280 × 720 (720p)' },
  { width: 1366, height: 768, label: '1366 × 768' },
  { width: 2560, height: 1080, label: '2560 × 1080 (Ultrawide)' },
  { width: 3440, height: 1440, label: '3440 × 1440 (Ultrawide)' },
];

function getFilteredResolutions(): { width: number; height: number; label: string }[] {
  const maxW = typeof screen !== 'undefined' ? screen.width : 1920;
  const maxH = typeof screen !== 'undefined' ? screen.height : 1080;
  return COMMON_RESOLUTIONS.filter(
    r => r.width <= maxW && r.height <= maxH || (r.width === 3840 && r.height === 2160)
  );
}

export interface AimTrainerCardContentProps {
  /** Baseline preferences (game, DPI, mouse travel). Used for emulate game default and config. */
  baselineSettings: BaselineSettings | null;
  /** Called when user wants to change preferences (e.g. "Change preferences" link). Optional. */
  onChangePreferences?: () => void;
}

export const AimTrainerCardContent: React.FC<AimTrainerCardContentProps> = ({
  baselineSettings,
  onChangePreferences
}) => {
  const mouseTravel = baselineSettings?.mouseTravel ?? null;
  const [conversions, setConversions] = useState<SensitivityConversion[]>([]);
  const [resolution, setResolution] = useState<string>('');
  const [fov, setFov] = useState<number>(AIM_TRAINER_DEFAULT_FOV);
  const [fovInput, setFovInput] = useState<string>(String(AIM_TRAINER_DEFAULT_FOV));
  const [emulateGame, setEmulateGame] = useState<string>('');
  const [fullscreen, setFullscreen] = useState(false);

  const resolutions = getFilteredResolutions();
  const defaultRes = resolutions[0];

  useEffect(() => {
    const loadConversions = async () => {
      try {
        const data = await window.sensitivityConverter.getAllConversionsFromBaseline();
        setConversions(data);
        if (data.length > 0 && !emulateGame) {
          const favorite = baselineSettings?.favoriteGame;
          const match = data.find(c => c.gameName === favorite) ?? data[0];
          setEmulateGame(match.gameName);
        }
      } catch (e) {
        console.error('Failed to load conversions', e);
      }
    };
    loadConversions();
  }, [baselineSettings]);

  useEffect(() => {
    if (resolutions.length > 0 && !resolution) {
      setResolution(`${defaultRes.width}x${defaultRes.height}`);
    }
  }, [resolutions, defaultRes, resolution]);

  const buildConfig = (): AimTrainerConfig => {
    const resMatch = resolution?.match(/^(\d+)x(\d+)$/);
    const w = resMatch ? parseInt(resMatch[1], 10) : defaultRes.width;
    const h = resMatch ? parseInt(resMatch[2], 10) : defaultRes.height;
    const conv = conversions.find(c => c.gameName === emulateGame);
    return {
      resolution: { width: w, height: h },
      fullscreen,
      emulateGame: emulateGame || conv?.gameName || '',
      emulateSensitivity: conv?.suggestedSensitivity ?? 1,
      fov: Math.max(1, Math.min(180, fov)) || AIM_TRAINER_DEFAULT_FOV,
      mouseTravel: baselineSettings?.mouseTravel,
      dpi: baselineSettings?.dpi,
    };
  };

  useEffect(() => {
    const sync = async () => {
      if (!(window as any).aimTrainer?.isOpen) return;
      const isOpen = await (window as any).aimTrainer.isOpen();
      if (isOpen) {
        (window as any).aimTrainer.updateConfig(buildConfig());
      }
    };
    sync();
  }, [resolution, fov, emulateGame, fullscreen]);

  const handleBegin = () => {
    (window as any).aimTrainer?.open?.(buildConfig());
  };

  const hasSettings = mouseTravel != null && baselineSettings != null;

  return (
    <form className="form" onSubmit={e => e.preventDefault()}>

      {hasSettings && (
        <>

          <div className="form-group">
            <label htmlFor="aim-trainer-emulate">Emulate game</label>
            <SearchableSelect
              id="aim-trainer-emulate"
              value={emulateGame}
              options={conversions.map(c => ({
                value: c.gameName,
                label: `${c.gameName} (${formatSensitivity(c.suggestedSensitivity)})`
              }))}
              placeholder="Select a game"
              onChange={setEmulateGame}
            />
          </div>
          {/* <div className="setting-row">
            <span className="setting-label">Your sensitivity</span>
            <span className="setting-value">{formatSensitivity(mouseTravel!)} cm/360°</span>
          </div> */}
        </>
      )}
      <div className="form-group">
        <label htmlFor="aim-trainer-resolution">Resolution</label>
        <SearchableSelect
          id="aim-trainer-resolution"
          value={resolution}
          options={resolutions.map(r => ({
            value: `${r.width}x${r.height}`,
            label: r.label
          }))}
          placeholder="Select resolution"
          onChange={setResolution}
          searchable={false}
        />
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={fullscreen}
            onChange={e => setFullscreen(e.target.checked)}
          />
          {' '}Fullscreen
        </label>
      </div>

      <div className="form-group aim-trainer-fov-group">
        <label htmlFor="aim-trainer-fov">FOV</label>
        <div className="aim-trainer-fov-controls">
          <input
            id="aim-trainer-fov"
            type="number"
            min={1}
            max={180}
            maxLength={3}
            value={fovInput}
            onChange={e => {
              const raw = e.target.value.replace(/\D/g, '').slice(0, 3);
              setFovInput(raw);
              const n = Number(raw);
              if (raw !== '' && !Number.isNaN(n)) setFov(n);
            }}
            onBlur={() => {
              const clamped = Math.max(1, Math.min(180, Math.round(Number(fovInput) || AIM_TRAINER_DEFAULT_FOV)));
              setFov(clamped);
              setFovInput(String(clamped));
            }}
            placeholder="90"
            aria-label="FOV value"
          />
          <input
            id="aim-trainer-fov-slider"
            type="range"
            min={1}
            max={180}
            value={Math.max(1, Math.min(180, fov))}
            onChange={e => {
              const n = Number(e.target.value);
              setFov(n);
              setFovInput(String(n));
            }}
            aria-label="FOV slider"
          />
        </div>
      </div>

      {!hasSettings && (
        <p className="text-muted">
          {onChangePreferences ? (
            <>
              Set your Mouse Travel in{' '}
              <button type="button" className="link-button" onClick={onChangePreferences}>
                preferences
              </button>
              {' '}to choose a game sensitivity.
            </>
          ) : (
            'Set your Mouse Travel in preferences to choose a game sensitivity.'
          )}
        </p>
      )}
      <div className="settings-navigation">
        <button type="button" className="settings-btn settings-btn-next" onClick={handleBegin}>
          Begin
        </button>
      </div>
    </form>
  );
};
