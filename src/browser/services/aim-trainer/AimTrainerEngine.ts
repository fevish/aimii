import * as THREE from 'three';

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

  // Pre-allocated objects to avoid GC
  private _euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private _vector = new THREE.Vector3();
  private _center = new THREE.Vector2(0, 0);

  // Game config
  private readonly TARGET_POOL_SIZE = 20;
  private readonly ROOM_SIZE = 50;
  private readonly TARGET_RADIUS = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

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
    // 5. Environment - Simple Room
    const geometry = new THREE.BoxGeometry(this.ROOM_SIZE, this.ROOM_SIZE, this.ROOM_SIZE);
    // Invert geometry to see inside
    geometry.scale(-1, 1, 1);

    // Grid texture or wireframe approach for "fake depth"
    const material = new THREE.MeshBasicMaterial({
      color: 0x333333,
      wireframe: true, // Cheap "grid" look
    });

    const room = new THREE.Mesh(geometry, material);
    this.scene.add(room);
  }

  private initTargets(): void {
    // 3. Object Pooling (The Targets)
    // Pre-allocate 20 target meshes
    // Low poly geometry: IcosahedronGeometry(radius, 1)
    const geometry = new THREE.IcosahedronGeometry(this.TARGET_RADIUS, 1);

    // Fake 3D depth by using a distinct flat color (red/orange)
    const material = new THREE.MeshBasicMaterial({ color: 0xff4444 });

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
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    // Game Logic (if needed, e.g moving targets)
    // For now, static targets until hit

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
      (Math.random() - 0.5) * range/2 + 1.6, // Height variation around eye level
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
