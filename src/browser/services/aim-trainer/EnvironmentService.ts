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
    // 1. Checkerboard floor (very faint dark colors)
    const tileSize = this.ROOM_SIZE / 10;
    const matA = new THREE.MeshBasicMaterial({ color: 0x0c0c0c, side: THREE.DoubleSide });
    const matB = new THREE.MeshBasicMaterial({ color: 0x101010, side: THREE.DoubleSide });
    const planeGeo = new THREE.PlaneGeometry(tileSize, tileSize);
    planeGeo.rotateX(-Math.PI / 2);

    for (let ix = 0; ix < 10; ix++) {
      for (let iz = 0; iz < 10; iz++) {
        const x = -this.ROOM_SIZE / 2 + tileSize / 2 + ix * tileSize;
        const z = -this.ROOM_SIZE / 2 + tileSize / 2 + iz * tileSize;
        const mat = (ix + iz) % 2 === 0 ? matA : matB;
        const tile = new THREE.Mesh(planeGeo, mat);
        tile.position.set(x, -0.01, z);
        scene.add(tile);
      }
    }

    // 3. Randomized stars (sky/ceiling – no grid)
    this.addStars(scene);

    // 4. 3D polygon mountains: instanced pyramid peaks (one draw call, reads as mountains)
    this.addMountainPeaks(scene);

    // 5. Background
    scene.background = new THREE.Color(0x111111);
  }

  private starsData: { geometry: THREE.BufferGeometry; blinkIndices: number[]; baseColors: Float32Array; phases: number[] } | null = null;

  /** Star field on a dome behind layer 4, horizon to zenith. ~1% blink (glow in/out). */
  private addStars(scene: THREE.Scene): void {
    const count = 600;
    const radius = 1550;
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
      const theta = rng() * Math.PI * 2;
      const t = Math.pow(rng(), 0.6);
      const phi = t * (Math.PI / 2 - 0.01);
      positions[i * 3 + 0] = radius * Math.cos(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(phi) * Math.sin(theta);
      const brightness = 0.6 + rng() * 0.5;
      const horizonFade = 0.88 + 0.12 * t;
      c.setRGB(brightness * horizonFade, brightness * 1.05 * horizonFade, brightness * 1.15 * horizonFade);
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

    const layers: { radius: number; radiusJitter: number; count: number; color: number; sizeRand: [number, number]; widthScale: number }[] = [
      { radius: 130, radiusJitter: 25, count: 50, color: 0x161a18, sizeRand: [0.5, 1.0], widthScale: 2.8 },
      { radius: 270, radiusJitter: 18, count: 65, color: 0x141816, sizeRand: [1.0, 2.0], widthScale: 5 },
      { radius: 520, radiusJitter: 15, count: 60, color: 0x121414, sizeRand: [2.5, 4.5], widthScale: 14 },
      { radius: 1150, radiusJitter: 20, count: 70, color: 0x141414, sizeRand: [7, 10], widthScale: 45 },
    ];

    for (const layer of layers) {
      const material = new THREE.MeshBasicMaterial({ color: layer.color });
      const mesh = new THREE.InstancedMesh(geometry, material, layer.count);
      const rng = seeded(1000 + layer.radius);

      for (let i = 0; i < layer.count; i++) {
        const angle = rng() * Math.PI * 2;
        const r = layer.radius + (rng() - 0.5) * 2 * layer.radiusJitter;
        const [sMin, sMax] = layer.sizeRand;
        const s = sMin + rng() * (sMax - sMin);
        const hScale = 0.7 + rng() * 0.8;
        const rotY = rng() * Math.PI * 2;
        const w = layer.widthScale * (0.8 + rng() * 0.5);

        position.set(r * Math.cos(angle), baseHeight * 0.5 * hScale * s, r * Math.sin(angle));
        scale.set(w, hScale * s, w);
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
