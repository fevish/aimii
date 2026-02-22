---
description: 3D aim trainer, Three.js, aim trainer engine, performance optimization, potato mode, MeshBasicMaterial
globs:
alwaysApply: false
---

# Project: Aimii Aim Trainer (Feature)

**Goal:** A lightweight, standalone 3D aim trainer integrated into the Aimii Electron app.
**Absolute Constraint:** The application MUST run at a flawless 60fps on low-end integrated graphics (potato PCs).
**Modes:** Support "Potato" (Max Performance, Low Poly) and "Normal" (Standard Visuals) graphics modes.
**Architecture Rule:** Keep features modular. Break down the trainer into sub-components (e.g., `FpsCounter`, `WeaponSystem`) and distinct services.
**High-Frequency UI Rule:** For HUD elements updating >10Hz (FPS, Ammo, Timer), use a **Service** to update the DOM directly (`element.innerText`). Do NOT use React State for the game loop to avoid re-renders.
**Input Isolation Rule:** All DOM event listeners (Keyboard, Mouse) must be handled by `InputService.ts` to keep the Engine focused on rendering and logic.
**Physics Isolation Rule:** All movement physics (Velocity, Gravity, Friction) must be handled by `MovementService.ts`. The Engine delegates updates via `.update()`.
**Environment Isolation Rule:** All static scene composition (Floor, Grid, Lighting) must be managed by `EnvironmentService.ts`. The Engine should only call `.init(scene)`.
**Integration Rule:** The trainer must respect global Aimii settings (Sensitivity, FOV, Resolution).

## 1. Engine & Renderer Initialization
*   **Dependency Version:** MUST use `three@0.160.0` and `@types/three@0.160.0` to avoid TypeScript breaking changes in newer versions.
*   **Context:** Instantiate `WebGLRenderer` with `{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false, depth: true }`.
*   **Pixel Ratio:** Cap the pixel ratio to prevent high-res displays from tanking performance. Use `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));`.
*   **Garbage Collection:** Pre-allocate all objects, vectors, and rays globally or in a class constructor. **Do not use `new` keywords or `.dispose()` inside the render loop.**

## 2. Visual Style & Zero Lighting Policy
*   **Strict Rule:** Do not add `DirectionalLight`, `PointLight`, `AmbientLight`, or shadows. Use **only** `THREE.MeshBasicMaterial`.
*   **Colors (Theme Integration):**
    *   **Targets:** Primary Green (`0x00ff88`).
    *   **Floor:** Checkerboard (Dark/Light Gray) + Green Grid Overlay.
    *   **Ceiling Grid:** Dark Teal (`0x225544`, `0x112222`).
    *   **Background/Void:** Dark Gray/Black (`0x111111`, `0x0a0a0a`).

## 3. Environment Scale
*   **Coordinate System:** 1 unit = 1 meter (movement, physics, and floor tiles use this scale).
*   **Floor Level:** Y = 0. Checkerboard floor (5×5 m tiles, 10×10 grid over 50×50 room).
*   **Room Size:** 50×50 units.
*   **Play Area:** North strip only; rectangular bounds (`PlayAreaBounds`: xMin, xMax, zMin, zMax). South boundary on tile line (z = 20), snug to north (z = 24.5). Movement and target spawning respect these bounds.
*   **Boundary Wall:** Single wall at play-area south edge (z = zMin). Three stacked blocks, same width (full play-area width): **bottom** and **top** = thin solid edges (height 0.02, slightly transparent); **middle** = transparent “glass” (opacity 0.12). Brand green (`0x00ff88`). All built in `EnvironmentService.addBoundaryWalls()`.
*   **Camera Height:** ~1.65 m (eye level).

## 4. Object Pooling (The Targets)
*   **Pre-allocation:** Create an array of 20 `THREE.Mesh` objects on initialization.
*   **Geometry:** `THREE.IcosahedronGeometry(radius, 1)`.
*   **Lifecycle:**
    *   **Spawn:** Select inactive mesh -> Update Position (`1m` to `7m` height) -> Set `.visible = true`.
    *   **Hit:** Set `.visible = false` -> Increment Score -> Trigger Respawn.

## 5. Input & Integration
*   **Mouse Control:** Native `Pointer Lock API`.
    *   Raw `movementX`/`movementY` mapped to camera Euler rotation (YXZ order).
    *   Pitch clamped to avoid flipping.
*   **Keyboard Control:**
    *   **Movement:** WASD for horizontal movement relative to camera yaw.
    *   **Walk:** Shift to walk (slower, ~52% speed).
    *   **Jump:** Spacebar for vertical impulse (only when `onGround`).
    *   **Physics:** Implement simple gravity, friction/damping, and floor collision (Y < 1.6).
*   **Hit Detection:** Raycaster from center screen `(0, 0)`.
    *   **Optimization:** Intersect **only** against visible targets. Never intersect the scene graph.
    *   **Return:** `handleClick()` returns `boolean` (true = hit) to update React state (score).
*   **React Integration:**
    *   Component: `src/components/AimTrainer/AimTrainer.tsx`.
    *   Entry: 'Trainer' tab in `MyMainWindow`.
    *   Overlay: HTML/CSS UI overlay (Start/Exit buttons, Score) displayed when pointer is unlocked.
    *   **FPS Counter:** Top-right, high-contrast green. Updates every 500ms via direct DOM manipulation (no React state) for performance.

## 6. Implementation Reference
*   **Core Engine:** `src/browser/services/aim-trainer/AimTrainerEngine.ts`
*   **UI Wrapper:** `src/components/AimTrainer/AimTrainer.tsx`
*   **Styles:** `src/components/AimTrainer/AimTrainer.css`