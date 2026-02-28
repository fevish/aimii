---
description: Aimii roadmap, feature planning, aim trainer phases, future features, priorities
globs:
alwaysApply: false
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

## feature: FOV matching (roadmap / vanity)

**KISS for now:** No implementation. Document options and intended behavior for a future release.

**Summary of options** (user would pick one; it would apply to their saved preferences and all conversions):

| Option | What it does |
|--------|----------------|
| **cm/360 (current)** | Match by angular sensitivity only. Same physical mouse distance = same 360° turn in every game. FOV can make it *feel* different (higher FOV = more screen motion per turn). |
| **0% MDV (monitor distance, center)** | Scale sensitivity by FOV so that movement at screen *center* matches. Same mouse move = same crosshair movement at center. Uses tan(FOV)-style formula. |
| **75% / 100% MDV** | Same idea, but reference point is 75% or 100% of the way to screen edge. Different “feel” trade-off; no single “correct” choice. |
| **Viewspeed** | Same family as MDV: scale so perceived “speed” of the world at a reference point matches. Often equivalent to 0% or center-based match. |

**Intended implementation (if we do it):** User selects one “FOV match type” in settings (e.g. “cm/360” vs “0% MDV” vs “Viewspeed”). That choice is stored with their preferences and applied to all sensitivity conversions and suggested values. We’d need FOV per game (and possibly per mode: hipfire vs ADS), plus the chosen formula. No code yet — roadmap only.

---

## feature: Aimii Core App Improvements
- [ ] **App Refactor & Scaling:** Clean up god components (`MyMainWindow.tsx`), implement consistent routing/state.
- [ ] **Game Detection Resiliency:** Ensure CS2 and others are detected even when GEP fails (Custom Fallback fix).
- [ ] **Resolution Awareness:** Include screen resolution in sensitivity/mouse travel calculations.
- [ ] **FOV matching:** See “FOV matching (roadmap / vanity)” above — user-chosen match type (cm/360 vs MDV/viewspeed) applied to saved preferences and conversions.
- [ ] **Profiles:** Allow users to save and swap between multiple profiles (different mouse travel, DPIs, specific game mains).
- [ ] **Aim Trainer Sens Adjust:** Allow users to dynamically adjust sensitivity/mouse travel inside the 3D Aim Trainer.
- [ ] **Math & Data Optimization:** Design a cleaner game sensitivity calculation structure and better data storage logic.
