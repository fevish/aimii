import React, { useEffect, useRef, useState } from 'react';
import { AimTrainerEngine } from '../../browser/services/aim-trainer/AimTrainerEngine';
import { FpsService } from '../../browser/services/aim-trainer/FpsService';
import { FpsCounter } from './FpsCounter/FpsCounter';
import './AimTrainer.css';

interface AimTrainerProps {
  onExit: () => void;
}

export const AimTrainer: React.FC<AimTrainerProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fpsRef = useRef<HTMLDivElement>(null);
  const fpsService = useRef(new FpsService());
  const engineRef = useRef<AimTrainerEngine | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Engine
    fpsService.current.setElement(fpsRef.current);
    const engine = new AimTrainerEngine(canvasRef.current, fpsService.current);
    engineRef.current = engine;

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

    const handleKeyDown = (e: KeyboardEvent) => engine.handleKeyDown(e.code);
    const handleKeyUp = (e: KeyboardEvent) => engine.handleKeyUp(e.code);

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

      if (document.pointerLockElement === canvasRef.current) {
        document.exitPointerLock();
      }
    };
  }, []);

  const handleStart = () => {
    if (canvasRef.current) {
      canvasRef.current.requestPointerLock();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isLocked && engineRef.current) {
      engineRef.current.handleMouseMove(e.movementX, e.movementY);
    }
  };

  const handleClick = () => {
    if (isLocked && engineRef.current) {
      const hit = engineRef.current.handleClick();
      if (hit) {
        setScore(prev => prev + 1);
      }
    }
  };

  return (
    <div className="aim-trainer-container">
      <canvas
        ref={canvasRef}
        className="aim-trainer-canvas"
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      />

      {/* FPS Counter */}
      <FpsCounter ref={fpsRef} />

      {/* Permanent Center Crosshair */}
      <div className="aim-crosshair" />

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
                Exit to Main Menu
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
  );
};
