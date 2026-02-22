import * as THREE from 'three';

export class TargetService {
  private targets: THREE.Mesh[] = [];
  private activeTargetCount = 0;
  private readonly TARGET_POOL_SIZE = 20;
  private readonly TARGET_RADIUS = 0.15;
  private bounds: { xMin: number; xMax: number; zMin: number; zMax: number } = { xMin: -12, xMax: 12, zMin: -12, zMax: 12 };

  // Reusable objects
  private _vector = new THREE.Vector3();

  public init(scene: THREE.Scene, bounds: { xMin: number; xMax: number; zMin: number; zMax: number }): void {
    this.bounds = bounds;

    // 3. Object Pooling (The Targets)
    // Pre-allocate 20 target meshes
    // Low poly geometry: IcosahedronGeometry(radius, 1)
    const geometry = new THREE.IcosahedronGeometry(this.TARGET_RADIUS, 1);

    // Use Primary Theme Color (0x00ff88)
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

    for (let i = 0; i < this.TARGET_POOL_SIZE; i++) {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.visible = false; // Start inactive
        scene.add(mesh);
        this.targets.push(mesh);
    }
  }

  public reset(): void {
      this.activeTargetCount = 0;
      this.targets.forEach(t => t.visible = false);
  }

  public spawnTarget(): void {
    if (this.activeTargetCount >= this.TARGET_POOL_SIZE) return;

    // Find an inactive mesh
    const target = this.targets.find(t => !t.visible);
    if (!target) return;

    const pad = 2;
    const x = this.bounds.xMin + pad + Math.random() * (this.bounds.xMax - this.bounds.xMin - pad * 2);
    const z = this.bounds.zMin + pad + Math.random() * (this.bounds.zMax - this.bounds.zMin - pad * 2);
    this._vector.set(x, 1 + Math.random() * 2, z);

    target.position.copy(this._vector);
    target.visible = true;
    this.activeTargetCount++;
  }

  public checkHit(raycaster: THREE.Raycaster): boolean {
    const activeTargets = this.targets.filter(t => t.visible);

    // Auto-spawn if empty (fail-safe for gameplay loop)
    if (activeTargets.length === 0) {
        this.spawnTarget();
        return false;
    }

    const intersects = raycaster.intersectObjects(activeTargets, false);

    if (intersects.length > 0) {
      const hitObject = intersects[0].object as THREE.Mesh;
      this.onTargetHit(hitObject);
      return true;
    }
    return false;
  }

  private onTargetHit(target: THREE.Mesh): void {
    target.visible = false;
    this.activeTargetCount--;
    this.spawnTarget();
  }

  public dispose(): void {
    this.targets.forEach(t => {
        t.geometry.dispose();
        (t.material as THREE.Material).dispose();
    });
    this.targets = [];
  }
}
