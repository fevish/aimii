import * as THREE from 'three';

export class TargetService {
  private targets: THREE.Mesh[] = [];
  private activeTargetCount = 0;
  private readonly TARGET_POOL_SIZE = 20;
  private readonly TARGET_RADIUS = 0.15;
  /** Spawn targets at player head/eye height (m). */
  private readonly SPAWN_HEIGHT = 1.65;
  /** Min distance (m) from wall to target zone (closest spawn). Valorant-like. */
  private readonly MIN_DISTANCE_FROM_WALL = 5;
  /** Target zone depth (m): how far behind the wall targets can spawn. Valorant practice range ~5–15 m. */
  private readonly TARGET_ZONE_DEPTH = 10;
  /** Target zone spawn bounds: same width as player zone, depth TARGET_ZONE_DEPTH starting MIN_DISTANCE_FROM_WALL beyond wall. */
  private spawnBounds: { xMin: number; xMax: number; zMin: number; zMax: number } = { xMin: -24, xMax: 24, zMin: -24, zMax: 24 };

  private _vector = new THREE.Vector3();

  public init(
    scene: THREE.Scene,
    playerZoneBounds: { xMin: number; xMax: number; zMin: number; zMax: number },
    _roomSize: number
  ): void {
    const wallZ = playerZoneBounds.zMin;
    const zMax = wallZ - this.MIN_DISTANCE_FROM_WALL;
    const zMin = zMax - this.TARGET_ZONE_DEPTH;
    this.spawnBounds = {
      xMin: playerZoneBounds.xMin,
      xMax: playerZoneBounds.xMax,
      zMin,
      zMax,
    };

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
    const x =
      this.spawnBounds.xMin +
      pad +
      Math.random() * (this.spawnBounds.xMax - this.spawnBounds.xMin - pad * 2);
    const z =
      this.spawnBounds.zMin +
      pad +
      Math.random() * (this.spawnBounds.zMax - this.spawnBounds.zMin - pad * 2);
    this._vector.set(x, this.SPAWN_HEIGHT, z);

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
