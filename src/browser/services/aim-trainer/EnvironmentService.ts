import * as THREE from 'three';

/** Pseudo-random but deterministic from seed */
function seeded(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

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

    // 3. Randomized stars (sky/ceiling – no grid)
    this.addStars(scene);

    // 4. 3D polygon mountains: instanced pyramid peaks (one draw call, reads as mountains)
    this.addMountainPeaks(scene);

    // 5. Background
    scene.background = new THREE.Color(0x111111);
  }

  private starsData: { geometry: THREE.BufferGeometry; blinkIndices: number[]; baseColors: Float32Array; phases: number[] } | null = null;

  /** Randomized star field high above, extending past the mountains. ~1% blink (glow in/out). */
  private addStars(scene: THREE.Scene): void {
    const count = 500;
    const yMin = 120;
    const yMax = 280;
    const xzHalf = 420;
    const rng = seeded(999);
    const blinkFraction = 0.01;
    const numBlink = Math.max(1, Math.floor(count * blinkFraction));

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const baseColors = new Float32Array(count * 3);
    const blinkIndices: number[] = [];
    const phases: number[] = [];
    const c = new THREE.Color();

    while (blinkIndices.length < numBlink) {
      const i = Math.floor(rng() * count);
      if (!blinkIndices.includes(i)) {
        blinkIndices.push(i);
        phases.push(rng() * Math.PI * 2);
      }
    }

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (rng() - 0.5) * 2 * xzHalf;
      positions[i * 3 + 1] = yMin + rng() * (yMax - yMin);
      positions[i * 3 + 2] = (rng() - 0.5) * 2 * xzHalf;
      const brightness = 0.6 + rng() * 0.5;
      c.setRGB(brightness, brightness * 1.05, brightness * 1.15);
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
      baseColors[i * 3 + 0] = c.r;
      baseColors[i * 3 + 1] = c.g;
      baseColors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.28,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    this.starsData = { geometry, blinkIndices, baseColors, phases };
  }

  /** Call each frame to animate star blink. Time in seconds. */
  public updateStars(timeSeconds: number): void {
    const data = this.starsData;
    if (!data) return;
    const colorAttr = data.geometry.getAttribute('color') as THREE.BufferAttribute;
    if (!colorAttr) return;
    const colors = colorAttr.array as Float32Array;
    for (let k = 0; k < data.blinkIndices.length; k++) {
      const i = data.blinkIndices[k];
      const glow = 1.0 + 0.4 * (0.5 + 0.5 * Math.sin(timeSeconds * 1.2 + data.phases[k]));
      colors[i * 3 + 0] = data.baseColors[i * 3 + 0] * glow;
      colors[i * 3 + 1] = data.baseColors[i * 3 + 1] * glow;
      colors[i * 3 + 2] = data.baseColors[i * 3 + 2] * glow;
    }
    colorAttr.needsUpdate = true;
  }

  /**
   * Instanced pyramid peaks in multiple rings – big, far, randomized (rotation + scale).
   * Layered radii give parallax when the player moves.
   */
  private addMountainPeaks(scene: THREE.Scene): void {
    const baseRadius = 12;
    const baseHeight = 35;
    const segments = 8;

    const geometry = new THREE.ConeGeometry(baseRadius, baseHeight, segments);
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3(1, 1, 1);
    const quat = new THREE.Quaternion();

    const layers: { radius: number; count: number; color: number; sizeRand: [number, number] }[] = [
      { radius: 140, count: 45, color: 0x1a2e22, sizeRand: [0.8, 1.6] },
      { radius: 220, count: 55, color: 0x152419, sizeRand: [0.6, 1.3] },
      { radius: 340, count: 65, color: 0x0f1812, sizeRand: [0.5, 1.1] },
    ];

    for (const layer of layers) {
      const material = new THREE.MeshBasicMaterial({ color: layer.color });
      const mesh = new THREE.InstancedMesh(geometry, material, layer.count);
      const rng = seeded(1000 + layer.radius);

      for (let i = 0; i < layer.count; i++) {
        const angle = rng() * Math.PI * 2;
        const r = layer.radius + (rng() - 0.5) * 60;
        const [sMin, sMax] = layer.sizeRand;
        const s = sMin + rng() * (sMax - sMin);
        const hScale = 0.7 + rng() * 0.8;
        const rotY = rng() * Math.PI * 2;

        position.set(r * Math.cos(angle), baseHeight * 0.5 * hScale * s, r * Math.sin(angle));
        scale.set(0.7 + rng() * 0.6, hScale * s, 0.7 + rng() * 0.6);
        quat.setFromEuler(new THREE.Euler(0, rotY, 0));

        matrix.compose(position, quat, scale);
        mesh.setMatrixAt(i, matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
      scene.add(mesh);
    }
  }

  public getRoomSize(): number {
    return this.ROOM_SIZE;
  }
}
