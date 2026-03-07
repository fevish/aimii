import * as THREE from 'three';

/** Player eye height in meters; humanoid matches this total height. */
export const HUMANOID_HEIGHT = 1.65;

/** Shoulder height (above feet) for arm placement. */
const SHOULDER_Y = 1.32;
/** Half arm length; arm center is this far from spine. */
const ARM_HALF_OFFSET = 0.25;

/**
 * Builds a low-poly humanoid Group (legs, torso, arms, head) with origin at feet.
 * Total height = HUMANOID_HEIGHT. Shared geometries can be used across pool instances.
 */
export function createHumanoidGroup(
  headGeo: THREE.SphereGeometry,
  torsoGeo: THREE.CylinderGeometry,
  legsGeo: THREE.CylinderGeometry,
  armGeo: THREE.CylinderGeometry,
  material: THREE.Material
): THREE.Group {
  const group = new THREE.Group();

  const legs = new THREE.Mesh(legsGeo, material);
  legs.position.y = 0.41;
  group.add(legs);

  const torso = new THREE.Mesh(torsoGeo, material);
  torso.position.y = 1.07;
  group.add(torso);

  const leftArm = new THREE.Mesh(armGeo, material);
  leftArm.position.set(-ARM_HALF_OFFSET, SHOULDER_Y, 0);
  leftArm.rotation.z = Math.PI / 2;
  group.add(leftArm);

  const rightArm = new THREE.Mesh(armGeo, material);
  rightArm.position.set(ARM_HALF_OFFSET, SHOULDER_Y, 0);
  rightArm.rotation.z = -Math.PI / 2;
  group.add(rightArm);

  const head = new THREE.Mesh(headGeo, material);
  head.position.y = 1.485;
  group.add(head);

  return group;
}

/**
 * Creates shared geometries and material for humanoid targets (HUMANOID_HEIGHT m tall, origin at feet).
 * Call once and pass to createHumanoidGroup for each pool instance.
 */
export function createHumanoidGeometries(): {
  headGeo: THREE.SphereGeometry;
  torsoGeo: THREE.CylinderGeometry;
  legsGeo: THREE.CylinderGeometry;
  armGeo: THREE.CylinderGeometry;
  material: THREE.Material;
} {
  const legsHeight = 0.82;
  const torsoHeight = 0.5;
  const headRadius = 0.165;
  const armLength = 0.5;
  const armRadius = 0.04;

  const headGeo = new THREE.SphereGeometry(headRadius, 8, 6);
  const torsoGeo = new THREE.CylinderGeometry(0.1, 0.1, torsoHeight, 8);
  const legsGeo = new THREE.CylinderGeometry(0.08, 0.08, legsHeight, 6);
  const armGeo = new THREE.CylinderGeometry(armRadius, armRadius, armLength, 5);

  const material = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

  return { headGeo, torsoGeo, legsGeo, armGeo, material };
}
