import * as THREE from 'three';
import { FpsService } from './FpsService';
import { InputService } from './InputService';
import { EnvironmentService } from './EnvironmentService';
import { TargetService } from './TargetService';
import { MovementService } from './MovementService';

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
    this.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    // 2. Zero Lighting Policy - Scene Setup
    this.scene = new THREE.Scene();
    // Background set by EnvironmentService

    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.6, 0); // Eye level

    this.raycaster = new THREE.Raycaster();

    if (this.environmentService) {
      this.environmentService.init(this.scene);
      this.ROOM_SIZE = this.environmentService.getRoomSize();
    }
    if (this.targetService) {
      this.targetService.init(this.scene, this.ROOM_SIZE);
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


    // 3. Input Handling
    if (this.inputService) {
        // A. Look
        const lookDelta = this.inputService.consumeLookDelta();
        if (lookDelta.x !== 0 || lookDelta.y !== 0) {
            const SENSITIVITY = 0.002;
            this._euler.setFromQuaternion(this.camera.quaternion);
            this._euler.y -= lookDelta.x * SENSITIVITY;
            this._euler.x -= lookDelta.y * SENSITIVITY;
            const PITCH_LIMIT = Math.PI / 2 - 0.01;
            this._euler.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this._euler.x));
            this.camera.quaternion.setFromEuler(this._euler);
        }

        // B. Movement
        if (this.movementService) {
            const moveState = this.inputService.getMoveState();
            this.movementService.update(
                delta,
                moveState,
                this.camera.quaternion,
                this.camera.position,
                this.ROOM_SIZE
            );
        }

        // Jump



    }

    // 4. Integrate Position




    this.renderer.render(this.scene, this.camera);
  };

  public handleResize(): void {
    if (!this.canvas) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

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
