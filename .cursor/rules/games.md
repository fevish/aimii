---
description: Game detection, games.data.ts, GEP, Custom Game Detector, processName, owGameId, scalingFactor
globs:
alwaysApply: false
---

# Game Detection & Data Configuration

This document explains how aimsii handles game detection and data mapping.

## `games.data.ts`
The central source of truth for all supported games.
Each game entry requires:
- `game`: Display Name.
- `scalingFactor`: The raw scalar used to convert `cm/360` to in-game sens (or base scalar for `specialConversion`).
- `owGameId`: Overwolf Game ID. Critical for Game Events Provider (GEP) and Overlay injection. Use '0' if unknown or unsupported by Overwolf.
- `processName`: The `.exe` name (e.g., `cs2.exe`). Optional but **highly recommended** as a fallback for the Custom Game Detector.
- `enable_for_app`: Boolean flag. Set to `true` to show in lists and enable detection.

## Detection Pipeline
We use a dual-detector system managed by `CurrentGameService`.

### 1. Game Events Provider (GEP)
- Handled by `gep.service.ts`.
- Uses Overwolf's official API to hook into games.
- Relies strictly on `owGameId`.
- **Limitation**: Some games (like CS2 occasionally) might have an Overlay ID but the GEP package fails to retrieve match/game info.

### 2. Custom Game Detector (Fallback)
- Handled by `custom-game-detector.service.ts`.
- Periodically runs `tasklist /FO CSV` under the hood.
- Matches running processes against the `processName` in `games.data.ts`.
- **Crucial Feature**: The Custom Detector MUST act as a fallback for *any* game with a defined `processName`, even if it has a valid `owGameId`, to catch cases where GEP fails to hook.

## Best Practice
Always define `processName` for any major title, even if Overwolf formally supports it, to guarantee detection resilience.
