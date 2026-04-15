# Aimii Roadmap

## Aim Trainer

### Phase 1 — Foundation (done)
- [x] Basic 3D environment (Three.js)
- [x] FPS movement (WASD + jump)
- [x] Simple targets (static/respawn)
- [x] Performance optimization (object pooling, no lights)
- [x] FPS counter

### Phase 2 — Modular refactor (done)
- [x] Componentize `AimTrainer.tsx` and Engine into `FpsCounter`, `Crosshair`, `ScoreBoard`
- [x] `InputService` — decoupled input handling
- [x] `EnvironmentService` — decoupled scene setup
- [x] `TargetService` — spawning and hit detection
- [x] `MovementService` — physics (gravity, velocity, friction)

### Phase 3 — Advanced Mechanics
- [ ] Weapon system: hitscan single-shot, hitscan auto, projectile
- [ ] Visual FX: bullet tracers, impact decals
- [ ] Lightweight physics engine for realistic collisions

### Phase 4 — Integration & Settings
- [ ] User profiles
- [ ] Respect mouse travel from aimii settings
- [ ] FOV slider
- [ ] Resolution handling (windowed vs windowed fullscreen)
- [ ] Graphics quality modes (Potato vs Normal)
- [ ] Overwolf ads within trainer

## Core App

- [ ] App refactor: clean up god components (`MyMainWindow.tsx`), consistent routing/state
- [ ] Game detection resiliency: CS2 + others detected even when GEP fails
- [ ] Resolution awareness in sensitivity/mouse travel calculations
- [ ] **FOV matching** — user-chosen match type (cm/360 vs 0% MDV vs Viewspeed) applied to all conversions
- [ ] Profiles: save and swap between multiple baselines (DPI, mouse travel, game main)
- [ ] Aim Trainer sens adjust: change sensitivity/mouse travel inside the trainer
- [ ] Cleaner sensitivity calculation structure and data storage

## FOV Matching (Future)

| Option          | Behavior                                                                   |
|-----------------|----------------------------------------------------------------------------|
| cm/360 (current)| Match by angular sensitivity only; FOV can make it feel different          |
| 0% MDV          | Scale so crosshair movement at screen center matches                       |
| 75% / 100% MDV  | Reference point at 75% or 100% to screen edge                              |
| Viewspeed       | Perceived speed at reference point matches; often equivalent to 0% MDV    |

**When implementing:** add "FOV match type" user preference; store per-profile; apply to all
conversions. Requires per-game FOV data (hipfire + ADS). No code yet — roadmap only.
