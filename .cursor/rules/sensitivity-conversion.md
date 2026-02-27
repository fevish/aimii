---
description: Sensitivity conversion formulas, cm/360, scalingFactor, specialConversion, conversionParams
globs:
alwaysApply: false
---

# Sensitivity Conversion Architecture

This document explains the math and structure powering the aimii converter.

## Where the logic lives

**Single implementation:** `src/utils/sensitivity-conversion.ts` (no Electron/browser deps).

- **`calculateCm360(game, sensitivity, dpi)`** – in-game sens + DPI → cm/360°
- **`calculateTargetSensitivity(game, cm360, targetDPI)`** – cm/360° + DPI → in-game sens

**Used by:**
- **GamesService** (main) – delegates to these functions; used for IPC and SensitivityConverterService (onboarding, suggested sens).
- **SensitivityCalculator** (renderer) – imports the same util for the calculator card.

Do not duplicate conversion formulas in components or services; use the shared util.

## The Universal Metric: `cm/360°`

Aimii uses physical mouse travel distance (`cm/360°`) as the universal baseline to convert sensitivity between any two games.

**Why cm/360?** In-game sensitivity multipliers are arbitrary. The physical distance for a 360° turn is a fixed metric.

## The Standard Formula

For games without `specialConversion`:
1. **Source to cm/360:** `inches360 = 360 / (game.scalingFactor * sensitivity * dpi)`, `cm360 = inches360 * 2.54`
2. **cm/360 to target:** `inches360 = cm360 / 2.54`, `targetSens = 360 / (game.scalingFactor * targetDPI * inches360)`

## Special Conversions

Games with `specialConversion: true` and `conversionParams` in `games.data.ts` use custom formulas (Battlefield, GTA5, PUBG, Minecraft, STALKER 2, First Descendant, XDefiant, etc.).

### conversionParams

- `linearCoefficient`, `offset`, `multiplier` (e.g. Battlefield)
- `constant`, `offset` (e.g. GTA5)
- `baseValue`, `scaleFactor` (e.g. PUBG exponential)
- Other combinations – see `games.data.ts` and the branches in `sensitivity-conversion.ts`

**Never change formulas without verifying with known game values.**
