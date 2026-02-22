import React, { useEffect, useRef, useState } from 'react';
import { AimTrainerEngine } from '../../browser/services/aim-trainer/AimTrainerEngine';
import { FpsService } from '../../browser/services/aim-trainer/FpsService';
import { InputService } from '../../browser/services/aim-trainer/InputService';
import { EnvironmentService } from '../../browser/services/aim-trainer/EnvironmentService';
import { TargetService } from '../../browser/services/aim-trainer/TargetService';
import { MovementService } from '../../browser/services/aim-trainer/MovementService';
import { FpsCounter } from './FpsCounter/FpsCounter';
import type { AimTrainerConfig } from '../../types/aim-trainer';
import './AimTrainer.css';

interface AimTrainerProps {
  config?: AimTrainerConfig | null;
  onExit: () => void;
}

export const AimTrainer: React.FC<AimTrainerProps> = ({ config, onExit }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const fpsService = useRef(new FpsService());
  const inputService = useRef(new InputService());
  const envService = useRef(new EnvironmentService());
  const targetService = useRef(new TargetService());
  const movementService = useRef(new MovementService());
  const engineRef = useRef<AimTrainerEngine | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Engine
    fpsService.current.setElement(fpsRef.current);
    const engine = new AimTrainerEngine(canvasRef.current, fpsService.current, inputService.current, envService.current, targetService.current, movementService.current);
    engineRef.current = engine;

    if (config?.resolution) {
      engine.setResolution(config.resolution.width, config.resolution.height);
    }
    if (config?.mouseTravel != null && config?.dpi != null) {
      engine.setLookSensitivity(config.mouseTravel, config.dpi);
    }

    // Pointer Lock Listener
    const handleLockChange = () => {
      if (document.pointerLockElement === canvasRef.current) {
        setIsLocked(true);
        engine.start();
      } else {
        setIsLocked(false);
        engine.stop();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => inputService.current.handleKeyDown(e.code);
    const handleKeyUp = (e: KeyboardEvent) => inputService.current.handleKeyUp(e.code);

    document.addEventListener('pointerlockchange', handleLockChange);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    // Initial resize handling
    const handleResize = () => engine.handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('pointerlockchange', handleLockChange);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('resize', handleResize);
      engine.dispose();
      inputService.current.reset();
      targetService.current.reset();
      movementService.current.reset();


      if (document.pointerLockElement === canvasRef.current) {
        document.exitPointerLock();
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current && config?.resolution) {
      engineRef.current.setResolution(config.resolution.width, config.resolution.height);
    }
  }, [config?.resolution?.width, config?.resolution?.height]);

  useEffect(() => {
    if (engineRef.current && config?.mouseTravel != null && config?.dpi != null) {
      engineRef.current.setLookSensitivity(config.mouseTravel, config.dpi);
    }
  }, [config?.mouseTravel, config?.dpi]);

  // Raw input: native mousemove on canvas when locked (bypasses React, applies look immediately per event)
  useEffect(() => {
    if (!isLocked || !canvasRef.current || !engineRef.current) return;
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    const onRawMouseMove = (e: MouseEvent) => engine.applyLookDelta(e.movementX, e.movementY);
    canvas.addEventListener('mousemove', onRawMouseMove);
    return () => canvas.removeEventListener('mousemove', onRawMouseMove);
  }, [isLocked]);

  const handleStart = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    canvas.focus();
    try {
      const lock = canvas.requestPointerLock as (options?: { unadjustedMovement?: boolean }) => void | Promise<void>;
      const p = lock.call(canvas, { unadjustedMovement: true }) as Promise<void> | undefined;
      if (p && typeof p.catch === 'function') {
        p.catch(() => canvas.requestPointerLock());
      }
    } catch {
      canvas.requestPointerLock();
    }
  };

  const handleMouseMove = () => {
    // Look is handled by native mousemove listener when locked (raw input)
  };

  const handleClick = () => {
    if (isLocked && engineRef.current) {
      const hit = engineRef.current.handleClick();
      if (hit) {
        setScore(prev => prev + 1);
      }
    }
  };

  const handleMinimize = () => window.windowControls?.minimize?.();
  const handleClose = () => window.windowControls?.close?.();

  const hideHeader = Boolean(config?.fullscreen && isLocked);
  const trainingActive = isLocked;

  return (
    <div className={`aim-trainer-window${hideHeader ? ' header-hidden' : ''}${trainingActive ? ' training-active' : ''}`}>
      <header className="app-header">
        <div className="app-logo">
          <h1>aimii.app aim trainer</h1>
        </div>
        <div className="header-controls">
          <div className="window-controls">
            <button type="button" onClick={handleMinimize} className="window-control-btn minimize-btn" aria-label="Minimize">_</button>
            <button type="button" onClick={handleClose} className="window-control-btn close-btn" aria-label="Close">✕</button>
          </div>
        </div>
      </header>
      <div ref={containerRef} className="aim-trainer-container">
      <canvas
        ref={canvasRef}
        className="aim-trainer-canvas"
        tabIndex={0}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />

      {/* FPS Counter */}
      <FpsCounter ref={fpsRef} />

      {/* Permanent Center Crosshair */}
      <div className="aim-crosshair" />

      {/* Ad in bottom right (same owadview as main window; cid required for multi-container policy) */}

      <section className="ad-section">
        <owadview />
      </section>

      {/* UI Overlay when unlocked */}
      {!isLocked && (
        <div className="aim-trainer-ui unlocked">
          <div className="aim-menu">
            <div>
              <h1 className="aim-title">Aim Trainer</h1>
              <p className="aim-subtitle">Click start to lock cursor</p>
            </div>

            <div className="aim-controls">
              <button className="aim-button primary" onClick={handleStart}>
                Start Training
              </button>
              <button className="aim-button secondary" onClick={onExit}>
                Close
              </button>
            </div>

            <div className="aim-stats">
              <div className="stat-item">
                <span className="stat-label">Targets Hit</span>
                <span className="stat-value">{score}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Accuracy</span>
                <span className="stat-value">--%</span>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
