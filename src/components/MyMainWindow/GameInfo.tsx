import React from 'react';
import { SensitivityConversion } from '../../browser/services/sensitivity-converter.service';
import { BaselineSettings } from '../../types/app';

interface GameInfoProps {
  title: string;
  gameName?: string;
  suggestedSensitivity: SensitivityConversion | null;
  canonicalSettings: BaselineSettings | null;
  mouseTravel: number | null;
  showNavigation?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  canNavigate?: boolean;
}

export const GameInfo: React.FC<GameInfoProps> = ({
  title,
  gameName,
  suggestedSensitivity,
  canonicalSettings,
  mouseTravel,
  showNavigation = false,
  onPrevious,
  onNext,
  canNavigate
}) => {
  return (
    <>
      <h2>{title}</h2>
      {/* Only show current sensitivity if we have suggested sensitivity (meaning we're in a different game) */}
      {suggestedSensitivity && (
        <>
          <p className="cool-text">// Suggested Sensitivity for {gameName}</p>
          <h4>{suggestedSensitivity.suggestedSensitivity.toFixed(3)}</h4>
        </>
      )}

      <div className="settings-grid">
        <div className="setting-row">
          <span className="setting-label">Current Game</span>
          <span className="setting-value">{gameName}</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">Mouse Travel</span>
          <span className="setting-value">
            {suggestedSensitivity
              ? `${suggestedSensitivity.mouseTravel.toFixed(2)} cm`
              : mouseTravel !== null
                ? `${mouseTravel.toFixed(2)} cm`
                : 'Calculating...'}
          </span>
        </div>
        <div className="setting-row">
          <span className="setting-label">eDPI</span>
          <span className="setting-value">{canonicalSettings?.eDPI}</span>
        </div>
        <div className="setting-row">
          <span className="setting-label">Mouse DPI</span>
          <span className="setting-value">{canonicalSettings?.dpi}</span>
        </div>
      </div>

      {showNavigation && (
        <div className="multi-games-nav">
          <button
            className="nav-arrow prev-arrow"
            onClick={onPrevious}
            disabled={!canNavigate}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M529-279 361-447q-7-7-10-15.5t-3-17.5q0-9 3-17.5t10-15.5l168-168q5-5 10.5-7.5T551-691q12 0 22 9t10 23v358q0 14-10 23t-22 9q-4 0-22-10Z" /></svg>
          </button>
          <button
            className="nav-arrow next-arrow"
            onClick={onNext}
            disabled={!canNavigate}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="currentColor"><path d="M529-279 361-447q-7-7-10-15.5t-3-17.5q0-9 3-17.5t10-15.5l168-168q5-5 10.5-7.5T551-691q12 0 22 9t10 23v358q0 14-10 23t-22 9q-4 0-22-10Z" /></svg>
          </button>
        </div>
      )}
    </>
  );
};

export default GameInfo;
