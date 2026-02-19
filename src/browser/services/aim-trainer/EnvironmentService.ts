import * as THREE from 'three';

export class EnvironmentService {
  private readonly ROOM_SIZE = 50;

  public init(scene: THREE.Scene): void {
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
    scene.add(q1);

    // Q2 (-X, +Z) -> Mat B
    const q2 = new THREE.Mesh(planeGeo, matB);
    q2.position.set(-quadSize / 2, -0.01, quadSize / 2);
    scene.add(q2);

    // Q3 (-X, -Z) -> Mat A
    const q3 = new THREE.Mesh(planeGeo, matA);
    q3.position.set(-quadSize / 2, -0.01, -quadSize / 2);
    scene.add(q3);

    // Q4 (+X, -Z) -> Mat B
    const q4 = new THREE.Mesh(planeGeo, matB);
    q4.position.set(quadSize / 2, -0.01, -quadSize / 2);
    scene.add(q4);

    // 2. Floor Grid (Primary Green/Dark Green)
    // Positioned slightly above floor planes to avoid z-fighting
    const floorGrid = new THREE.GridHelper(this.ROOM_SIZE, 20, 0x00ff88, 0x225544);
    floorGrid.position.y = 0;
    scene.add(floorGrid);

    // 3. Ceiling Grid (Darker/Subtle)
    const ceilingGrid = new THREE.GridHelper(this.ROOM_SIZE, 20, 0x225544, 0x112222);
    ceilingGrid.position.y = 15; // 15 meters high
    scene.add(ceilingGrid);

    // 4. Background
    scene.background = new THREE.Color(0x111111);
  }

  public getRoomSize(): number {
    return this.ROOM_SIZE;
  }
}
