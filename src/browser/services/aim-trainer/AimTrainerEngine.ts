import * as THREE from 'three';
import { FpsService } from './FpsService';

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

  // Pre-allocated objects to avoid GC
  private _euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private _vector = new THREE.Vector3();
  private _center = new THREE.Vector2(0, 0);

  // Physics & Movement
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  private onGround = false;
  private moveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
  };

  // Game config
  private readonly TARGET_POOL_SIZE = 20;
  private readonly ROOM_SIZE = 50;
  private readonly TARGET_RADIUS = 1;

  constructor(canvas: HTMLCanvasElement, fpsService: FpsService | null = null) {
    this.canvas = canvas;
    this.fpsService = fpsService;

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
    this.scene.background = new THREE.Color(0x111111); // Dark background

    this.camera = new THREE.PerspectiveCamera(
      75,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 1.6, 0); // Eye level

    this.raycaster = new THREE.Raycaster();

    this.initEnvironment();
    this.initTargets();
  }

  private initEnvironment(): void {
    // 5. Environment - Normalized Scale (1 unit = 1 meter)
    // Floor at Y=0, Camera at Y=1.6

    // 1. Checkerboard Floor Plane (4 Quadrants for Orientation)
    const quadSize = this.ROOM_SIZE / 2;
    const planeGeo = new THREE.PlaneGeometry(quadSize, quadSize);
    planeGeo.rotateX(-Math.PI / 2);

    // Colors: A = Dark, B = Slightly Lighter (Subtle contrast)
    const matA = new THREE.MeshBasicMaterial({ color: 0x0a0a0a, side: THREE.DoubleSide });
    const matB = new THREE.MeshBasicMaterial({ color: 0x141414, side: THREE.DoubleSide });

    // Q1 (+X, +Z) -> Mat A
    const q1 = new THREE.Mesh(planeGeo, matA);
    q1.position.set(quadSize / 2, -0.01, quadSize / 2);
    this.scene.add(q1);

    // Q2 (-X, +Z) -> Mat B
    const q2 = new THREE.Mesh(planeGeo, matB);
    q2.position.set(-quadSize / 2, -0.01, quadSize / 2);
    this.scene.add(q2);

    // Q3 (-X, -Z) -> Mat A
    const q3 = new THREE.Mesh(planeGeo, matA);
    q3.position.set(-quadSize / 2, -0.01, -quadSize / 2);
    this.scene.add(q3);

    // Q4 (+X, -Z) -> Mat B
    const q4 = new THREE.Mesh(planeGeo, matB);
    q4.position.set(quadSize / 2, -0.01, -quadSize / 2);
    this.scene.add(q4);

    // 2. Floor Grid (Primary Green/Dark Green)
    // Positioned slightly above floor planes to avoid z-fighting
    const floorGrid = new THREE.GridHelper(this.ROOM_SIZE, 20, 0x00ff88, 0x225544);
    floorGrid.position.y = 0;
    this.scene.add(floorGrid);

    // 3. Ceiling Grid (Darker/Subtle)
    const ceilingGrid = new THREE.GridHelper(this.ROOM_SIZE, 20, 0x225544, 0x112222);
    ceilingGrid.position.y = 15; // 15 meters high
    this.scene.add(ceilingGrid);
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

  public handleKeyDown(code: string): void {
    switch (code) {
      case 'KeyW': this.moveState.forward = true; break;
      case 'KeyS': this.moveState.backward = true; break;
      case 'KeyA': this.moveState.left = true; break;
      case 'KeyD': this.moveState.right = true; break;
      case 'Space':
        if (this.onGround) {
          this.velocity.y = 15.0; // Jump force
          this.onGround = false;
        }
        break;
    }
  }

  public handleKeyUp(code: string): void {
    switch (code) {
      case 'KeyW': this.moveState.forward = false; break;
      case 'KeyS': this.moveState.backward = false; break;
      case 'KeyA': this.moveState.left = false; break;
      case 'KeyD': this.moveState.right = false; break;
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

    // 3. Input Acceleration (Relative to Camera Yaw)
    if (this.moveState.forward || this.moveState.backward || this.moveState.left || this.moveState.right) {
        // Get camera Y rotation (Yaw)
        const yRotation = this._euler.setFromQuaternion(this.camera.quaternion).y;

        // Construct movement vector in locally oriented space
        // Forward (W) = -Z (Standard Three.js forward)
        // Backward (S) = +Z
        // Left (A) = -X
        // Right (D) = +X

        // Input strength
        const inputX = Number(this.moveState.right) - Number(this.moveState.left);
        const inputZ = Number(this.moveState.backward) - Number(this.moveState.forward);

        // Normalize input vector (avoid faster diagonal movement)
        this.direction.set(inputX, 0, inputZ);
        this.direction.normalize();

        // Rotate local direction by Camera Yaw to get Global Direction
        this.direction.applyAxisAngle(new THREE.Vector3(0, 1, 0), yRotation);

        // Apply Acceleration to Velocity
        this.velocity.x += this.direction.x * SPEED * delta;
        this.velocity.z += this.direction.z * SPEED * delta;
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
    if (!this.isRunning) return;

    // 4. Input - Raw mouse delta mapping
    // Sensitivity factor (tunable)
    const SENSITIVITY = 0.002;

    this._euler.setFromQuaternion(this.camera.quaternion);

    this._euler.y -= movementX * SENSITIVITY;
    this._euler.x -= movementY * SENSITIVITY;

    // Clamp pitch to avoid flipping (-90 to 90 degrees)
    const PITCH_LIMIT = Math.PI / 2 - 0.01;
    this._euler.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this._euler.x));

    this.camera.quaternion.setFromEuler(this._euler);
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

    const activeTargets = this.targets.filter(t => t.visible);
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
    const target = this.targets.find(t => !t.visible);
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
    this.targets.forEach(t => {
        t.geometry.dispose();
        (t.material as THREE.Material).dispose();
    });
  }
}
