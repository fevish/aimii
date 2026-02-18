---
trigger: always_on
---

# Project: Ultra-Optimized Three.js Aim Trainer (Electron/Overwolf)

**Goal:** Build a lightweight, standalone 3D aim trainer within an Electron app.
**Absolute Constraint:** The application MUST run at a flawless 60fps on low-end integrated graphics (potato PCs).

Please write the complete, modular JavaScript/TypeScript code for the Three.js engine based on the strict architectural rules below.

## 1. Engine & Renderer Initialization
* **Context:** Instantiate `WebGLRenderer` with `{ antialias: false, powerPreference: "high-performance", alpha: false, stencil: false, depth: true }`.
* **Pixel Ratio:** Cap the pixel ratio to prevent high-res displays from tanking performance. Use `renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));`.
* **Garbage Collection:** Pre-allocate all objects, vectors, and rays globally or in a class constructor. **Do not use `new` keywords or `.dispose()` inside the render loop.**

## 2. Zero Lighting Policy
* **Strict Rule:** Do not add `DirectionalLight`, `PointLight`, `AmbientLight`, or shadows to the scene. Real-time lighting is the biggest bottleneck for low-end machines.
* **Materials:** Use **only** `THREE.MeshBasicMaterial` for every object.
* **Visuals:** Fake 3D depth by baking a simple gradient into the target textures, or rely on distinct flat colors for targets vs. the environment grid.

## 3. Object Pooling (The Targets)
* **Pre-allocation:** On initialization, create an array of 20 target meshes.
* **Geometry:** Keep poly-counts extremely low. Use `THREE.IcosahedronGeometry(radius, 1)` or an 8-segment `SphereGeometry` for the targets.
* **Spawning/Despawning:** To spawn a target, select an inactive mesh from the pool, update its position via `.position.set()`, and toggle `.visible = true`. On a successful hit, toggle `.visible = false`. Do not destroy or recreate meshes.

## 4. Input & Hit Registration
* **Mouse Control:** Use the native `Pointer Lock API` (`canvas.requestPointerLock()`). Listen for `mousemove` events and map the raw `movementX` and `movementY` deltas directly to the camera's yaw and pitch.
* **Raycasting:** On click, fire a `THREE.Raycaster` from the center of the screen `(0, 0)`.
* **Intersection Optimization:** Only check intersections against the active target pool array. Do NOT intersect against the entire scene graph or the environment walls.

## 5. Environment & Game Loop
* **Room:** Create a simple room using a large inverted `BoxGeometry` with a dark, wireframe, or grid-textured `MeshBasicMaterial`.
* **Loop:** Use `requestAnimationFrame`. Calculate the `delta` time and multiply all target movements/spawning logic by `delta` to ensure frame-rate-independent speeds.

**Output:** Provide the core Three.js implementation class/function, and note where the Electron IPC calls should trigger the pointer lock and close the window.