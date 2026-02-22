import * as THREE from 'three';
import { FpsService } from './FpsService';
import { InputService } from './InputService';
import { EnvironmentService } from './EnvironmentService';
import { TargetService } from './TargetService';
import { MovementService } from './MovementService';

/**
 * Aim trainer look baseline: CS2/Source m_yaw (degrees per mouse count at sens 1.0).
 * Used when user has no mouseTravel/DPI. Horizontal and vertical use the same multiplier (1:1);
 * CS2 and Valorant both use 1:1 H/V, so this baseline matches both as reference games.
 */
const BASELINE_YAW_DEG_CS2 = 0.02199999511;

export class AimTrainerEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private raycaster: THREE.Raycaster;

  private isRunning = false;
  private lastTime = 0;
  private animationFrameId: number | null = null;
  private canvas: HTMLCanvasElement;
  private fpsService: FpsService | null;
  private inputService: InputService | null;
  private environmentService: EnvironmentService | null;
  private targetService: TargetService | null;
  private movementService: MovementService | null;

  // Pre-allocated objects to avoid GC
  private _euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private _vector = new THREE.Vector3();
  private _center = new THREE.Vector2(0, 0);


  // Game config
  private ROOM_SIZE = 50;
  private playerZoneBounds: { xMin: number; xMax: number; zMin: number; zMax: number } = { xMin: -24, xMax: 24, zMin: -24, zMax: 24 };
  private forcedWidth: number | null = null;
  private forcedHeight: number | null = null;

  /** Radians per movementX/movementY (same for horizontal and vertical; 1:1 like CS2/Valorant). */
  private lookSensitivityRadPerPixel = (BASELINE_YAW_DEG_CS2 * Math.PI) / 180;

  constructor(canvas: HTMLCanvasElement, fpsService: FpsService | null = null, inputService: InputService | null = null, environmentService: EnvironmentService | null = null, targetService: TargetService | null = null, movementService: MovementService | null = null) {
    this.canvas = canvas;
    this.fpsService = fpsService;
    this.inputService = inputService;
    this.environmentService = environmentService;
    this.targetService = targetService;
    this.movementService = movementService;

    // 1. Engine & Renderer Initialization
    // { antialias: false, powerPreference: "high-performance", alpha: false, stencil: false, depth: true }
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true,
    });

    // Cap pixel ratio to 1.5 max for performance
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    // 2. Zero Lighting Policy - Scene Setup
    this.scene = new THREE.Scene();
    // Background set by EnvironmentService

    const initW = canvas.clientWidth || 800;
    const initH = canvas.clientHeight || 600;
    this.camera = new THREE.PerspectiveCamera(
      75,
      initW / initH,
      0.1,
      2000
    );
    this.raycaster = new THREE.Raycaster();

    if (this.environmentService) {
      this.environmentService.init(this.scene);
      this.ROOM_SIZE = this.environmentService.getRoomSize();
      this.playerZoneBounds = this.environmentService.getPlayerZoneBounds();
    }
    const b = this.playerZoneBounds;
    this.camera.position.set((b.xMin + b.xMax) / 2, 1.65, (b.zMin + b.zMax) / 2);
    if (this.targetService) {
      this.targetService.init(this.scene, this.playerZoneBounds, this.ROOM_SIZE);
    }

    this.renderer.setSize(initW, initH, false);
  }

  /**
   * Apply raw mouse delta immediately (no batching). Use this from a native mousemove listener for raw input.
   * Call this on every pointer move when locked; do not also consume look delta in the game loop.
   */
  public applyLookDelta(movementX: number, movementY: number): void {
    if (movementX === 0 && movementY === 0) return;
    this._euler.setFromQuaternion(this.camera.quaternion);
    this._euler.y -= movementX * this.lookSensitivityRadPerPixel;
    this._euler.x -= movementY * this.lookSensitivityRadPerPixel;
    const PITCH_LIMIT = Math.PI / 2 - 0.01;
    this._euler.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this._euler.x));
    this.camera.quaternion.setFromEuler(this._euler);
  }

  /**
   * Set look sensitivity from user's cm/360° and DPI so that physical mouse movement matches their preference.
   * Uses same physical mapping as games: 360° = mouseTravel cm → counts = mouseTravel * (dpi/2.54); rad per count = 2π / counts.
   * When mouseTravel or dpi is invalid, falls back to baseline (CS2 sens 1.0).
   */
  public setLookSensitivity(mouseTravel: number, dpi: number): void {
    if (mouseTravel > 0 && dpi > 0) {
      const CM_PER_INCH = 2.54;
      const countsPer360 = (mouseTravel * dpi) / CM_PER_INCH;
      this.lookSensitivityRadPerPixel = (2 * Math.PI) / countsPer360;
    } else {
      this.lookSensitivityRadPerPixel = (BASELINE_YAW_DEG_CS2 * Math.PI) / 180;
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    // Initial spawn
    if (this.targetService) {
        this.targetService.spawnTarget();
    }

    this.loop();
  }

  public stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }



  private loop = (): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.loop);

    const time = performance.now();
    const delta = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    // --- FPS Counter ---
    // --- FPS Counter ---
    if (this.fpsService) {
        this.fpsService.update(delta);
    }

    // --- Physics Step ---
    const SPEED = 50.0;
    const FRICTION = 10.0;
    const GRAVITY = 30.0;

    // 1. Friction (Damping)


    // 2. Gravity


    // 3. Input Handling (look is applied in native mousemove via applyLookDelta for raw input)
    if (this.inputService) {
        // Movement
        if (this.movementService) {
            const moveState = this.inputService.getMoveState();
            this.movementService.update(
                delta,
                moveState,
                this.camera.quaternion,
                this.camera.position,
                this.playerZoneBounds
            );
        }

        // Jump



    }

    // 4. Integrate Position

    if (this.environmentService) {
      this.environmentService.updateStars(time / 1000);
    }

    this.renderer.render(this.scene, this.camera);
  };

  public setResolution(width: number, height: number): void {
    this.forcedWidth = width;
    this.forcedHeight = height;
    this.applySize();
  }

  public handleResize(): void {
    if (!this.canvas) return;
    this.applySize();
  }

  private applySize(): void {
    if (!this.canvas) return;

    const width = this.forcedWidth ?? this.canvas.clientWidth;
    const height = this.forcedHeight ?? this.canvas.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  public handleMouseMove(movementX: number, movementY: number): void {
    // Moved to InputService
  }


  public handleClick(): boolean {
    if (!this.isRunning) return false;

    // 4. Raycasting from center screen (0, 0)
    this.raycaster.setFromCamera(this._center, this.camera);

    if (this.targetService) {
        return this.targetService.checkHit(this.raycaster);
    }
    return false;
  }



  public dispose(): void {
    this.stop();
    // Disposal logic if we ever destroy the engine
    // Since we avoid 'dispose' in loop, we do it here
    this.renderer.dispose();
    // Geometries and materials should be disposed too if this component unmounts entirely
    if (this.targetService) {
        this.targetService.dispose();
    }
  }
}
