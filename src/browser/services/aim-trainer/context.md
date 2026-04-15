# src/browser/services/aim-trainer/ — Aim Trainer Engine

**Goal:** Flawless 60fps on low-end integrated graphics (potato PCs).
**Three.js version:** Must use `three@0.160.0` and `@types/three@0.160.0` — newer versions have breaking TS changes.

## Renderer

```ts
new WebGLRenderer({
  antialias: false,
  powerPreference: 'high-performance',
  alpha: false,
  stencil: false,
  depth: true,
})
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
```

## Zero Lighting Policy

No `DirectionalLight`, `PointLight`, `AmbientLight`, or shadows. Use `MeshBasicMaterial` only.

**Color palette:**
- Targets: `0x00ff88` (brand green)
- Floor: checkerboard dark/light gray + green grid overlay
- Ceiling grid: `0x225544` / `0x112222`
- Background/void: `0x111111` / `0x0a0a0a`

## Memory Management

Pre-allocate all objects, vectors, and rays in constructors. **Never use `new` or `.dispose()`
inside the render loop.** Pre-allocate ~20 target meshes using `IcosahedronGeometry(radius, 1)`.

## Environment Scale

- 1 unit = 1 meter
- Floor at Y = 0; room is 50×50 units; 5×5 m floor tiles
- **Player zone:** north strip, 70% room width, z = 20–24.5; camera at Y ≈ 1.65
- **Target zone:** other side of boundary wall, 10 m depth; targets at Y = 1.65
- **Boundary wall** (z = zMin): three stacked blocks same width as zones —
  thin transparent bottom/top edges + `opacity: 0.12` glass middle; brand green

## Input

**Mouse (Pointer Lock):**
- `requestPointerLock({ unadjustedMovement: true })`
- Raw `movementX`/`movementY` → camera yaw/pitch (YXZ Euler, no deltaTime)
- Applied in a native canvas `mousemove` listener — not React, no rAF batching
- Pitch clamped to avoid flipping
- Sensitivity baseline: CS2 sens 1.0 (`m_yaw = 0.02199999511°/count`)
- If `AimTrainerConfig` provides `mouseTravel` (cm/360) + `dpi`: `radPerCount = 2π / (mouseTravel * dpi / 2.54)`

**Keyboard:** WASD movement relative to camera yaw; Shift = walk (~52%); Space = jump
**Hit detection:** Raycaster from screen center — intersect only against visible targets, never the full scene graph

## Service Isolation Rules

| Service              | Responsibility                                      |
|----------------------|-----------------------------------------------------|
| `InputService.ts`    | All DOM event listeners (keyboard + mouse)          |
| `MovementService.ts` | All movement physics (velocity, gravity, friction)  |
| `EnvironmentService.ts` | All static scene composition (floor, grid, walls) |
| `TargetService.ts`   | Target spawning, pooling, and hit detection         |
| `FpsService.ts`      | FPS counter (DOM direct write, not React state)     |
| `AimTrainerEngine.ts`| Render loop — delegates to the above via `.update()` |

## High-Frequency UI Rule

For HUD elements updating >10 Hz (FPS, ammo, timer): update DOM directly (`element.innerText`).
Do NOT use React state for game-loop values — it causes excessive re-renders.

## Window Config

- Frameless, non-resizable (pointer lock confines cursor on Windows)
- Window height = resolution height + `AIM_TRAINER_HEADER_HEIGHT_PX` (40px)
- See `window-state.service.ts`, `aim-trainer-window.controller.ts`
