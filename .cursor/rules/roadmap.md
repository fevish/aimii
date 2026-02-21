---
globs:
alwaysApply: true
---

# Aimii Project Roadmap

## Core Architecture Goals
*   **Modularity:** All features must be broken down into small, self-contained sub-components and services.
*   **Performance:** The Aim Trainer MUST maintain 60fps on low-end hardware (Integrated Graphics).
*   **Integration:** The Aim Trainer interacts seamlessly with the main Aimii app's settings (Sensitivity, Profiles, FOV).

## feature: Aim Trainer Evolution

### Phase 1: Foundation (Current)
- [x] Basic 3D Environment (Three.js)
- [x] FPS Movement (WASD + Jump)
- [x] Simple Targets (Static/Respawn)
- [x] Performance Optimization (Object Pooling, No Lights)
- [x] FPS Counter

### Phase 2: modular-refactor (Immediate)
- [x] **Componentization:** Break `AimTrainer.tsx` and `Engine` into smaller pieces (e.g., `FpsCounter`, `Crosshair`, `ScoreBoard`).
- [x] **Input Service:** Decouple input handling from the rendering engine.
- [x] **Environment Service:** Decouple scene setup.
- [x] **Target Service:** Manage spawning and hit detection.
- [x] **Movement Service:** Handle physics (Gravity, Velocity, Friction) and Input state.

### Phase 3: Advanced Mechanics
- [ ] **Weapon System:**
    - Hitscan Single Shot (Bolt Action)
    - Hitscan Automatic (Spray Patterns/Recoil)
    - Projectile (Ballistics/Travel Time)
- [ ] **Visual FX:**
    - Bullet Sprites/Tracers
    - Impact Decals (Walls vs Targets)
- [ ] **Physics Engine:** Integrate a lightweight physics API (e.g., `crashcat` or similar) for realistic collisions.

### Phase 4: Integration & Settings
- [ ] **User Profiles:** Support multiple aim profiles.
- [ ] **Mouse Travel:** Respect user's current "Mouse Travel" setting from Aimii.
- [ ] **FOV Slider:** Add Field of View configuration.
- [ ] **Resolution Handling:** Support common resolutions, Windowed vs Windowed Fullscreen.
- [ ] **Graphics Quality:** "Potato" (Low Poly/No Textures/No Shadows) vs "Normal" modes.
- [ ] **Ads:** Display Overwolf ads within the trainer (non-intrusive).

## feature: Aimii Core App Improvements
- [ ] **App Refactor & Scaling:** Clean up god components (`MyMainWindow.tsx`), implement consistent routing/state.
- [ ] **Game Detection Resiliency:** Ensure CS2 and others are detected even when GEP fails (Custom Fallback fix).
- [ ] **Resolution Awareness:** Include screen resolution in sensitivity/mouse travel calculations.
- [ ] **FOV Settings:** Global FOV setting that applies to calculations and the trainer.
- [ ] **Profiles:** Allow users to save and swap between multiple profiles (different mouse travel, DPIs, specific game mains).
- [ ] **Aim Trainer Sens Adjust:** Allow users to dynamically adjust sensitivity/mouse travel inside the 3D Aim Trainer.
- [ ] **Math & Data Optimization:** Design a cleaner game sensitivity calculation structure and better data storage logic.
