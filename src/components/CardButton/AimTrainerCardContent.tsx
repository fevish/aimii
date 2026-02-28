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

interface AimTrainerCardContentProps {
  mouseTravel: number | null;
  canonicalSettings: BaselineSettings | null;
}

export const AimTrainerCardContent: React.FC<AimTrainerCardContentProps> = ({
  mouseTravel,
  canonicalSettings
}) => {
  const [conversions, setConversions] = useState<SensitivityConversion[]>([]);
  const [resolution, setResolution] = useState<string>('');
  const [fov, setFov] = useState<number>(AIM_TRAINER_DEFAULT_FOV);
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
          const favorite = canonicalSettings?.favoriteGame;
          const match = data.find(c => c.gameName === favorite) ?? data[0];
          setEmulateGame(match.gameName);
        }
      } catch (e) {
        console.error('Failed to load conversions', e);
      }
    };
    loadConversions();
  }, [canonicalSettings]);

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
      fov: Math.max(1, Math.min(179, fov)) || AIM_TRAINER_DEFAULT_FOV,
      mouseTravel: canonicalSettings?.mouseTravel,
      dpi: canonicalSettings?.dpi,
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

  const hasSettings = mouseTravel != null && canonicalSettings != null;

  return (
    <form className="form" onSubmit={e => e.preventDefault()}>
      <div className="form-group">
        <label htmlFor="aim-trainer-resolution">Resolution</label>
        <select
          id="aim-trainer-resolution"
          value={resolution}
          onChange={e => setResolution(e.target.value)}
        >
          {resolutions.map(r => (
            <option key={`${r.width}x${r.height}`} value={`${r.width}x${r.height}`}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group aim-trainer-fov-group">
        <label htmlFor="aim-trainer-fov">FOV (horizontal °)</label>
        <div className="aim-trainer-fov-controls">
          <input
            id="aim-trainer-fov-slider"
            type="range"
            min={1}
            max={179}
            value={Math.max(1, Math.min(179, fov))}
            onChange={e => setFov(Number(e.target.value))}
            aria-label="FOV slider"
          />
          <input
            id="aim-trainer-fov"
            type="number"
            min={1}
            max={179}
            value={fov}
            onChange={e => {
              if (e.target.value === '') {
                setFov(AIM_TRAINER_DEFAULT_FOV);
                return;
              }
              const n = Number(e.target.value);
              if (!Number.isNaN(n)) setFov(n);
            }}
            onBlur={() => {
              /* Clamp to valid range when leaving the field so slider and display stay in sync */
              const clamped = Math.max(1, Math.min(179, Math.round(fov)));
              if (fov !== clamped) setFov(clamped);
            }}
            placeholder="90"
            aria-label="FOV value"
          />
        </div>
        <span className="text-muted">e.g. 90 (CS2 default)</span>
      </div>

      {hasSettings && (
        <>
          <div className="setting-row">
            <span className="setting-label">Your sensitivity</span>
            <span className="setting-value">{formatSensitivity(mouseTravel!)} cm/360°</span>
          </div>

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
        </>
      )}

      {!hasSettings && (
        <p className="text-muted">
          Set your Mouse Travel in preferences to choose a game sensitivity.
        </p>
      )}

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

      <div className="settings-navigation">
        <button type="button" className="settings-btn settings-btn-next" onClick={handleBegin}>
          Begin
        </button>
      </div>
    </form>
  );
};
