import * as THREE from 'three';

export class TargetService {
  private targets: THREE.Mesh[] = [];
  private activeTargetCount = 0;
  private readonly TARGET_POOL_SIZE = 20;
  private readonly TARGET_RADIUS = 1;
  private roomSize = 50;

  // Reusable objects
  private _vector = new THREE.Vector3();

  public init(scene: THREE.Scene, roomSize: number): void {
    this.roomSize = roomSize;

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

    // Random position within room bounds (minus padding)
    const range = this.roomSize / 2 - 2;

    this._vector.set(
      (Math.random() - 0.5) * range * 2,
      1 + Math.random() * 6, // Height: 1m to 7m (Floor is 0)
      (Math.random() - 0.5) * range * 2
    );

    // Ensure it's not too close to camera (assuming camera at 0,0,0 horizontal)
    if (this._vector.length() < 5) {
        this._vector.setZ(this._vector.z - 10);
    }

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
