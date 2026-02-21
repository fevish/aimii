import React, { useState, useEffect } from 'react';
import { formatSensitivity } from '../../utils/format';
import { SensitivityConversion } from '../../browser/services/sensitivity-converter.service';
import type { BaselineSettings } from '../../types/app';
import './AimTrainerLaunchConfig.css';

export interface AimTrainerConfig {
  resolution: { width: number; height: number };
  fullscreen: boolean;
  emulateGame: string;
  emulateSensitivity: number;
}

interface AimTrainerLaunchConfigProps {
  mouseTravel: number | null;
  canonicalSettings: BaselineSettings | null;
  onBack: () => void;
}

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
  return COMMON_RESOLUTIONS.filter(r => r.width <= maxW && r.height <= maxH);
}

export const AimTrainerLaunchConfig: React.FC<AimTrainerLaunchConfigProps> = ({
  mouseTravel,
  canonicalSettings,
  onBack
}) => {
  const [conversions, setConversions] = useState<SensitivityConversion[]>([]);
  const [resolution, setResolution] = useState<string>('');
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
      emulateSensitivity: conv?.suggestedSensitivity ?? 1
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
  }, [resolution, emulateGame, fullscreen]);

  const handleBegin = () => {
    (window as any).aimTrainer?.open?.(buildConfig());
  };

  const hasSettings = mouseTravel != null && canonicalSettings != null;

  return (
    <div className="aim-trainer-launch-config">
      <div className="aim-launch-content">
        <h1 className="aim-launch-title">Aim Trainer</h1>
        <p className="aim-launch-subtitle">Configure and launch</p>

        <div className="aim-launch-form">
          <div className="aim-launch-field">
            <label htmlFor="resolution">Resolution</label>
            <select
              id="resolution"
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

          <div className="aim-launch-field">
            <label htmlFor="profile">Profile</label>
            <select id="profile" disabled>
              <option>Default (Coming soon)</option>
            </select>
          </div>

          {hasSettings && (
            <>
              <div className="aim-launch-field aim-launch-readonly">
                <label>Your sensitivity</label>
                <span className="aim-launch-value">
                  {formatSensitivity(mouseTravel!)} cm/360°
                </span>
              </div>

              <div className="aim-launch-field">
                <label htmlFor="emulate">Emulate game</label>
                <select
                  id="emulate"
                  value={emulateGame}
                  onChange={e => setEmulateGame(e.target.value)}
                >
                  {conversions.map(c => (
                    <option key={c.gameName} value={c.gameName}>
                      {c.gameName} ({formatSensitivity(c.suggestedSensitivity)})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {!hasSettings && (
            <p className="aim-launch-hint">
              Set your Mouse Travel in preferences to choose a game sensitivity.
            </p>
          )}

          <div className="aim-launch-field aim-launch-checkbox">
            <label>
              <input
                type="checkbox"
                checked={fullscreen}
                onChange={e => setFullscreen(e.target.checked)}
              />
              Fullscreen
            </label>
          </div>

          <div className="aim-launch-actions">
            <button className="aim-button primary" onClick={handleBegin}>
              Begin
            </button>
            <button className="aim-button secondary" onClick={onBack}>
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="aim-trainer-ad-corner">
        <owadview />
      </div>
    </div>
  );
};
