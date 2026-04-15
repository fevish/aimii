import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import './BackgroundPulseGrid.css';

interface BackgroundPulseGridProps {
  /** Interval in ms between automatic wave pulses. Defaults to 5000. */
  waveIntervalMs?: number;
}

const USER_PULSE_CLASS = 'background-pulse-grid__tile--active';

export const BackgroundPulseGrid: React.FC<BackgroundPulseGridProps> = ({
  waveIntervalMs = 5000
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  /** --tile-count in CSS = tiles per row; grid is always square (same for rows and columns). */
  const [tilesPerRowFromCss, setTilesPerRowFromCss] = useState<number | null>(null);

  useLayoutEffect(() => {
    if (!gridRef.current) return;
    const val = getComputedStyle(gridRef.current).getPropertyValue('--tile-count').trim();
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) setTilesPerRowFromCss(num);
  }, []);

  const size = tilesPerRowFromCss ?? 0;
  const hasCount = size > 0;

  const tilesRef = useRef<HTMLDivElement[]>([]);
  const intervalRef = useRef<number | null>(null);

  const tiles = React.useMemo(
    () =>
      hasCount
        ? Array.from({ length: size * size }, (_, index) => {
            const r = Math.floor(index / size);
            const c = index % size;
            return { index, r, c };
          })
        : [],
    [size, hasCount]
  );

  const triggerSinglePulse = (el: HTMLDivElement | null) => {
    if (!el) return;
    el.classList.remove(USER_PULSE_CLASS);
    // Force reflow to restart animation
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    el.offsetWidth;
    el.classList.add(USER_PULSE_CLASS);
  };

  const triggerWave = () => {
    tiles.forEach(tile => {
      const el = tilesRef.current[tile.index];
      if (!el) return;
      const delay = (tile.r + tile.c) * 100;
      window.setTimeout(() => {
        triggerSinglePulse(el);
      }, delay);
    });
  };

  useEffect(() => {
    // Initial wave
    triggerWave();

    // Repeating wave
    intervalRef.current = window.setInterval(() => {
      triggerWave();
    }, waveIntervalMs);

    return () => {
      if (intervalRef.current !== null) {
        window.clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tiles, waveIntervalMs]);

  return (
    <div
      ref={gridRef}
      className="background-pulse-grid"
      aria-hidden="true"
      style={{ visibility: hasCount ? 'visible' : 'hidden' }}
    >
      {tiles.map(tile => (
        <div
          key={tile.index}
          className="background-pulse-grid__tile"
          ref={el => {
            if (el) {
              tilesRef.current[tile.index] = el;
            }
          }}
          onMouseEnter={e => triggerSinglePulse(e.currentTarget)}
        />
      ))}
    </div>
  );
};

