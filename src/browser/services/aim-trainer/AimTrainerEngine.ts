import * as THREE from 'three';
import { FpsService } from './FpsService';
import { InputService } from './InputService';
import { EnvironmentService } from './EnvironmentService';

export class AimTrainerEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private raycaster: THREE.Raycaster;
  private targets: THREE.Mesh[] = [];
  private activeTargetCount = 0;
  private isRunning = false;
  private lastTime = 0;
  private animationFrameId: number | null = null;
  private canvas: HTMLCanvasElement;
  private fpsService: FpsService | null;
  private inputService: InputService | null;
  private environmentService: EnvironmentService | null;

  // Pre-allocated objects to avoid GC
  private _euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private _vector = new THREE.Vector3();
  private _center = new THREE.Vector2(0, 0);

  // Physics & Movement
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private onGround = false;


  // Game config
  private readonly TARGET_POOL_SIZE = 20;
  private readonly TARGET_RADIUS = 1;
  private ROOM_SIZE = 50;

  constructor(canvas: HTMLCanvasElement, fpsService: FpsService | null = null, inputService: InputService | null = null, environmentService: EnvironmentService | null = null) {
    this.canvas = canvas;
    this.fpsService = fpsService;
    this.inputService = inputService;
    this.environmentService = environmentService;

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
    this.initTargets();
  }



  private initTargets(): void {
    // 3. Object Pooling (The Targets)
    // Pre-allocate 20 target meshes
    // Low poly geometry: IcosahedronGeometry(radius, 1)
    const geometry = new THREE.IcosahedronGeometry(this.TARGET_RADIUS, 1);

    // Use Primary Theme Color (0x00ff88)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

    for (let i = 0; i < this.TARGET_POOL_SIZE; i++) {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.visible = false; // Start inactive
      this.scene.add(mesh);
      this.targets.push(mesh);
    }
  }

  public start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();

    // Initial spawn
    this.spawnTarget();

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
    this.velocity.x -= this.velocity.x * FRICTION * delta;
    this.velocity.z -= this.velocity.z * FRICTION * delta;

    // 2. Gravity
    this.velocity.y -= GRAVITY * delta;

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
        const moveState = this.inputService.getMoveState();

        // Jump
        if (moveState.jump && this.onGround) {
             this.velocity.y = 15.0;
             this.onGround = false;
        }

        if (moveState.forward || moveState.backward || moveState.left || moveState.right) {
            // Get camera Y rotation (Yaw)
            const yRotation = this._euler.setFromQuaternion(this.camera.quaternion).y;

            // Input strength
            const inputX = Number(moveState.right) - Number(moveState.left);
            const inputZ = Number(moveState.backward) - Number(moveState.forward);

            // Normalize input vector (avoid faster diagonal movement)
            this.direction.set(inputX, 0, inputZ);
            this.direction.normalize();

            // Rotate local direction by Camera Yaw to get Global Direction
            this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), yRotation);

            // Apply Acceleration to Velocity
            this.velocity.x += this.direction.x * SPEED * delta;
            this.velocity.z += this.direction.z * SPEED * delta;
        }
    }

    // 4. Integrate Position
    this.camera.position.addScaledVector(this.velocity, delta);

    // 5. Floor Collision
    if (this.camera.position.y < 1.6) {
        this.velocity.y = 0;
        this.camera.position.y = 1.6;
        this.onGround = true;
    }

    // 6. Room Boundaries
    const LIMIT = this.ROOM_SIZE / 2 - 1;
    this.camera.position.x = Math.max(-LIMIT, Math.min(LIMIT, this.camera.position.x));
    this.camera.position.z = Math.max(-LIMIT, Math.min(LIMIT, this.camera.position.z));

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

    // 4. Intersection Optimization: Only check active targets
    // Filter active targets first to minimize checks?
    // Or just check all and rely on frustum culling/visible check internal to Three.js?
    // Raycaster checks against visible objects only if configured, but let's be explicit manually if needed.
    // Three.js Raycaster checks all objects passed, regardless of visibility usually, UNLESS we filter.

    const activeTargets = this.targets.filter((t: THREE.Mesh) => t.visible);
    if (activeTargets.length === 0) {
        // If no targets (game won?), spawn one just in case
        this.spawnTarget();
        return false;
    }

    const intersects = this.raycaster.intersectObjects(activeTargets, false);

    if (intersects.length > 0) {
      // Hit!
      const hitObject = intersects[0].object as THREE.Mesh;
      this.onTargetHit(hitObject);
      return true;
    }
    return false;
  }

  private onTargetHit(target: THREE.Mesh): void {
    // 3. Spawning/Despawning: Toggle visibility only
    target.visible = false;
    this.activeTargetCount--;

    // Spawn new one immediately
    this.spawnTarget();
  }

  private spawnTarget(): void {
    if (this.activeTargetCount >= this.TARGET_POOL_SIZE) return;

    // Find an inactive mesh
    const target = this.targets.find((t: THREE.Mesh) => !t.visible);
    if (!target) return;

    // Random position within room bounds (minus padding)
    const range = this.ROOM_SIZE / 2 - 2;
    // Keep it somewhat in front of the player initially or all around?
    // Let's do forward-biased 180 degrees for now, or full 360?
    // Full 360 logic:

    this._vector.set(
      (Math.random() - 0.5) * range * 2,
      1 + Math.random() * 6, // Height: 1m to 7m (Floor is 0)
      (Math.random() - 0.5) * range * 2
    );

    // Ensure it's not too close to camera
    if (this._vector.length() < 5) {
        this._vector.setZ(this._vector.z - 10);
    }

    target.position.copy(this._vector);
    target.visible = true;
    this.activeTargetCount++;
  }

  public dispose(): void {
    this.stop();
    // Disposal logic if we ever destroy the engine
    // Since we avoid 'dispose' in loop, we do it here
    this.renderer.dispose();
    // Geometries and materials should be disposed too if this component unmounts entirely
    this.targets.forEach((t: THREE.Mesh) => {
        t.geometry.dispose();
        (t.material as THREE.Material).dispose();
    });
  }
}
