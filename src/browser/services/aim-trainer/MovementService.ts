import * as THREE from 'three';
import { MoveState } from './InputService';

export class MovementService {
  // CS2/Valorant Inspired Physics Constants (1 unit = 1 meter)
  private readonly RUN_SPEED = 5.4;
  private readonly WALK_SPEED = 2.8;
  private readonly JUMP_IMPULSE = 7.1; // ~1.25m height with 20g
  private readonly GRAVITY = 25.0;
  private readonly FRICTION = 10.0; // Sharp stopping
  private readonly ACCELERATION = 50.0; // Snappy movement
  private readonly AIR_ACCELERATION = 8.0; // CS2 style air accelerate (usually 12-100 depending on tick, 14 feels good here)
  private readonly AIR_SPEED_CAP = 0.8; // ~30 units/s equivalent. Allows strafing to add speed.
  private readonly AIR_STOP_SPEED = 2.0; // Base speed for air friction calculations (simplified)

  public velocity = new THREE.Vector3();
  public onGround = false;

  // Reusable vectors
  private _direction = new THREE.Vector3();
  private _wishDir = new THREE.Vector3();

  public update(delta: number, moveState: MoveState, cameraQuaternion: THREE.Quaternion, cameraPosition: THREE.Vector3, bounds: { xMin: number; xMax: number; zMin: number; zMax: number }): void {
    // 1. Queue Jump (Before Friction to enable Bhop)
    if (moveState.jump && this.onGround) {
        this.velocity.y = this.JUMP_IMPULSE;
        this.onGround = false;
    }

    // 2. Friction check (Only if we didn't just jump)
    this.applyFriction(delta); // Only applies if onGround

    // 3. Gravity
    this.velocity.y -= this.GRAVITY * delta;

    // 4. Movement Calculation
    this.applyMovement(delta, moveState, cameraQuaternion);

    // 5. Integrate Position
    cameraPosition.addScaledVector(this.velocity, delta);

    // 6. Floor Collision (eye height ~1.65 m)
    const EYE_HEIGHT = 1.65;
    if (cameraPosition.y < EYE_HEIGHT) {
        this.velocity.y = 0;
        cameraPosition.y = EYE_HEIGHT;
        this.onGround = true;
    } else {
        if (cameraPosition.y > EYE_HEIGHT + 0.01) {
             this.onGround = false;
        }
    }

    // 7. Play area boundaries (Valorant-style: solid walls, zero velocity on impact)
    if (cameraPosition.x > bounds.xMax) {
      cameraPosition.x = bounds.xMax;
      this.velocity.x = Math.min(0, this.velocity.x);
    } else if (cameraPosition.x < bounds.xMin) {
      cameraPosition.x = bounds.xMin;
      this.velocity.x = Math.max(0, this.velocity.x);
    }
    if (cameraPosition.z > bounds.zMax) {
      cameraPosition.z = bounds.zMax;
      this.velocity.z = Math.min(0, this.velocity.z);
    } else if (cameraPosition.z < bounds.zMin) {
      cameraPosition.z = bounds.zMin;
      this.velocity.z = Math.max(0, this.velocity.z);
    }
  }

  private applyFriction(delta: number): void {
      if (!this.onGround) return;

      const speed = this.velocity.length();
      if (speed < 0.1) {
          this.velocity.set(0, 0, 0);
          return;
      }

      // Standard Source-like friction
      // If speed is very low, we might snap to stop, but FRICTION * delta handles damping well enough for now
      // We only dampen X/Z, not Y (gravity handles Y)
      const drop = speed * this.FRICTION * delta;

      const newSpeed = Math.max(0, speed - drop);
      if (newSpeed !== speed) {
          this.velocity.multiplyScalar(newSpeed / speed);
      }
  }

  private applyMovement(delta: number, moveState: MoveState, cameraQuaternion: THREE.Quaternion): void {
      // 1. Determine Wish Direction
      const inputX = Number(moveState.right) - Number(moveState.left);
      const inputZ = Number(moveState.backward) - Number(moveState.forward);

      if (inputX === 0 && inputZ === 0) return;

      // Get Y-rotation only from camera
      const euler = new THREE.Euler(0, 0, 0, 'YXZ');
      euler.setFromQuaternion(cameraQuaternion);

      this._wishDir.set(inputX, 0, inputZ).normalize();
      this._wishDir.applyAxisAngle(new THREE.Vector3(0, 1, 0), euler.y);

      // 2. Determine Max Speed
      // 2. Determine Max Speed
      const currentSpeedLimit = this.onGround
          ? (moveState.walk ? this.WALK_SPEED : this.RUN_SPEED)
          : this.AIR_SPEED_CAP;

      // 3. Acceleration (Ground vs Air)
      const accel = this.onGround ? this.ACCELERATION : this.AIR_ACCELERATION;

      // 4. Apply Velocity
      // Simple acceleration logic: add velocity in wish direction up to max speed
      // "Projected velocity" method for Source-like air strafing would be:
      // current_speed_in_wish_dir = velocity dot wish_dir
      // add_speed = max_speed - current_speed_in_wish_dir
      // if add_speed > 0, add accel * delta * wish_dir (clamped by add_speed)

      const currentSpeedInWishDir = this.velocity.dot(this._wishDir);
      const addSpeed = currentSpeedLimit - currentSpeedInWishDir;

      if (addSpeed > 0) {
          // Identify actual acceleration amount to add
          let accelSpeed = accel * delta;

          // If we are in air, allow higher acceleration to facilitate strafing (Source-style)
          if (!this.onGround) {
               accelSpeed = accel * delta * 5.0;
          }

          if (accelSpeed > addSpeed) {
              accelSpeed = addSpeed;
          }

          this.velocity.x += accelSpeed * this._wishDir.x;
          this.velocity.z += accelSpeed * this._wishDir.z;
      }
  }

  public reset(): void {
      this.velocity.set(0, 0, 0);
      this.onGround = false;
  }
}
