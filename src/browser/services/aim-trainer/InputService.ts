export interface MoveState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  walk: boolean;
}

export class InputService {
  private moveState: MoveState = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    walk: false,
  };

  private lookDelta = { x: 0, y: 0 };

  public handleKeyDown(code: string): void {
    switch (code) {
      case 'KeyW': this.moveState.forward = true; break;
      case 'KeyS': this.moveState.backward = true; break;
      case 'KeyA': this.moveState.left = true; break;
      case 'KeyD': this.moveState.right = true; break;
      case 'Space': this.moveState.jump = true; break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveState.walk = true;
        break;
    }
  }

  public handleKeyUp(code: string): void {
    switch (code) {
      case 'KeyW': this.moveState.forward = false; break;
      case 'KeyS': this.moveState.backward = false; break;
      case 'KeyA': this.moveState.left = false; break;
      case 'KeyD': this.moveState.right = false; break;
      case 'Space': this.moveState.jump = false; break;
      case 'ShiftLeft':
      case 'ShiftRight':
        this.moveState.walk = false;
        break;
    }
  }

  public handleMouseMove(movementX: number, movementY: number): void {
    this.lookDelta.x += movementX;
    this.lookDelta.y += movementY;
  }

  public getMoveState(): MoveState {
    return this.moveState;
  }

  public consumeLookDelta() {
    const delta = { ...this.lookDelta };
    this.lookDelta.x = 0;
    this.lookDelta.y = 0;
    return delta;
  }

  public reset(): void {
    this.moveState = {
      forward: false,
      backward: false,
      left: false,
      right: false,
      jump: false,
      walk: false,
    };
    this.lookDelta = { x: 0, y: 0 };
  }
}
