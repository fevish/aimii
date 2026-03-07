---
description: Core Aimii directives, architecture, agent constraints, game identification, sensitivity math
globs:
alwaysApply: true
---

# Aimii Project Rules & Architecture

## 1. Core Directives (NON-NEGOTIABLE)

- **Identity**: Always refer to the project as `aimii` (lowercase).
- **Framework**: Overwolf-Electron (NOT native Overwolf).
- **Agent Constraints**:
  - **NO** direct git commits (suggest only).
  - **NO** direct `npm`/`yarn` execution (prompt only).
  - **NO** CSS generation (user handles design/styles).
- **Styling**: No inline styles; use external CSS files.

## 2. Architecture & Patterns

- **App Structure**:
  - `src/browser/`: Main process services & controllers (logic layer).
  - `src/components/`: React UI components (view layer).
  - `src/preload/`: Context bridge APIs.
- **Event-Driven**:
  - **NO** polling for game detection or state. Use `EventEmitter`.
  - Debounce game updates (~200ms).
- **IPC/Binding**:
  - **Main Window**: `contextIsolation: true`.
  - **Widget**: `contextIsolation: false` (direct access).
  - **Controllers**: Centralize IPC handlers in `src/browser/controllers/`.

## 3. Critical Implementation Details

- **Game Identification**:
  - **ALWAYS** use `gameInfo.classId` (static ID from `games.json`).
  - **NEVER** use `gameInfo.id` (dynamic session ID).
- **Sensitivity Mathematics**:
  - **Universal Baseline**: `cm/360°` (Centimeters per 360-degree turn).
  - **Core Formula**: `mouseTravel = (dpi * sensitivity * scalingFactor) / 2.54`.
  - **True Sens**: `Math.round(mouseTravel * 10)`.
  - **eDPI**: `dpi * sensitivity` (display metric only).
- **Data Models**:
  - `GameData` must unify: `game` (name), `owGameId` (classId), `scalingFactor`, `processName`.

## 4. Feature: Aim Trainer (Performance Critical)

**Goal**: Flawless 60fps on integrated graphics (low-end).

- **Renderer Config**:
  - `antialias: false`, `powerPreference: "high-performance"`, `stencil: false`, `depth: true`.
  - **Max Pixel Ratio**: `Math.min(window.devicePixelRatio, 1.5)`.
- **Zero Lighting Policy**:
  - **NO** lights (`DirectionalLight`, `PointLight`, `AmbientLight`).
  - **NO** shadows.
  - **Material**: `MeshBasicMaterial` ONLY.
- **Memory Management**:
  - **Object Pooling**: Pre-allocate ~20 targets. **NO** `new`/`dispose` inside render loop.
  - Geometry: Low-poly (`IcosahedronGeometry` or 8-seg Sphere).
- **Input**:
  - `Pointer Lock API`.
  - Raw `movementX` / `movementY` mapped directly to camera yaw/pitch.

## 5. Feature: Ad Detection & UI

- **Goal**: Visually indicate ad status without impacting performance.
- **Implementation**:
  - **Service**: `AdService` (detects `ad-started`, `ad-completed`).
  - **UI State**: Apply CSS class `.ad-running` to `terminal-container` when ads are active.
  - **Falback**: Graceful handling if detection API fails.

## 6. GDPR / Consent Management (CMP)

- **EU Detection**:
  - Registry: `HKCU\Software\aimii\GDPRRegion`.
  - Fallback: `app.overwolf.isCMPRequired()`.
- **Flow**:
  1. **Layer 1**: Installer/Onboarding notice.
  2. **Layer 2**: Granular settings via `app.overwolf.openAdPrivacySettingsWindow()`.

## 7. File Structure Reference

- **Services**: `src/browser/services/` (GameService, SensitivityService, AdService, SettingsService).
- **Controllers**: `src/browser/controllers/` (MainWindowController, WidgetWindowController).
- **Data**: `src/data/games.data.ts` (Game database).
