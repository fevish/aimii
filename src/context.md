# src/ — App Context

## Core Problem

Different FPS games use unique formulas and scaling ratios for mouse sensitivity. An in-game sensitivity
of `0.5` in Valorant equals approximately `1.591` in CS2. aimii solves this by using `cm/360°`
(physical mouse travel per 360° turn) as a universal baseline for all conversions.

## Key Data Models

```typescript
// GameData – defined in src/data/games.data.ts, re-exported from src/types/app.ts
interface GameData {
  game: string;                     // Display name
  processName?: string;             // .exe name for custom detection
  scalingFactor: number;            // Game-specific sensitivity scalar
  owGameId: string;                 // Overwolf classId (NOT session id)
  owConstant?: string;
  owGameName?: string;
  enable_for_app: boolean;          // Show in lists and enable detection
  specialConversion?: boolean;      // Uses custom conversion formula
  conversionParams?: ConversionParams;
}

interface BaselineSettings {
  mouseTravel: number;              // cm/360° — PRIMARY metric
  dpi: number;
  trueSens: number;                 // Math.round(mouseTravel * 10)
  favoriteGame: string;
  favoriteSensitivity: number;
  eDPI: number;                     // dpi * favoriteSensitivity (display only)
}
```

Always import `GameData` from `src/types/app` (re-exported from `src/data/games.data.ts`).
All conversion math lives in `src/utils/sensitivity-conversion.ts` — never duplicate formulas.

## User Experience Flow

### First-Time Setup (Onboarding)
1. Welcome screen
2. Game selection (user's primary game)
3. Sensitivity input for selected game
4. DPI configuration
5. Baseline (mouse travel) calculation and confirmation

### Daily Usage
1. App auto-detects current game
2. Shows suggested sensitivity based on user's baseline
3. Overlay widget displays sensitivity in-game
4. Manual calculator available for ad-hoc conversions

## CMP / GDPR Integration

GDPR compliance is required for EU users only.

**Detection:**
- Registry: `HKCU\Software\aimii\Privacy` → `Region = "EU"` (set by installer EU checkbox)
- Fallback: `app.overwolf.isCMPRequired()` (Overwolf API) if no registry entry exists
- Safety default: show CMP if detection fails

**Two-layer flow:**
- **Layer 1** — installer + onboarding: initial notice for EU users
- **Layer 2** — settings: opens `app.overwolf.openAdPrivacySettingsWindow()` for granular controls

**Key files:**
- `src/browser/services/cmp.service.ts` — reads registry, calls Overwolf CMP API
- `src/browser/controllers/cmp.controller.ts` — IPC handlers
- `src/components/Settings/Settings.tsx` — renders `.privacy-link` button (EU only)
- `scripts/installer.nsh` — writes Region to registry

**Testing without reinstall:** set `CMPService.TEST_EU_USER = true` in `cmp.service.ts`.

Non-EU users see no privacy UI.

## IPC Pattern

All renderer → main communication goes through `src/preload/preload.ts` (contextBridge).
Main window uses `contextIsolation: true`; widget uses `contextIsolation: false` (direct access).
IPC handlers are centralized in `src/browser/controllers/`.

## Game Detection

Uses a dual-detector system managed by `CurrentGameService`:
1. **GEP** (`gep.service.ts`) — Overwolf's official API, keyed on `owGameId` (classId)
2. **Custom Detector** (`custom-game-detector.service.ts`) — `tasklist /FO CSV` fallback, keyed on `processName`

Always use `gameInfo.classId` (static). Never use `gameInfo.id` (dynamic session ID).
See `src/data/context.md` for full detection details.
