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

---

## Games with horizontal and vertical sliders

Some games (e.g. **Arc Raiders**) expose separate H and V sensitivity sliders (e.g. 0–100 each). The conversion pipeline should stay the same; only how we **interpret and display** the result changes.

### Principle: one logical sensitivity

- **Conversion math is unchanged.** We still compute a single **logical sensitivity** (e.g. 13.887) so that, for the game’s formula and the user’s DPI, the result is the desired cm/360°.
- That number is the “effective” in-game sensitivity. For a single-slider game we show it as-is. For H/V games we derive what to show in the UI from this one value.

### What to do with 13.887 for Arc Raiders (H and V 0–100)

1. **If the game uses our formula’s sensitivity directly as the slider value**  
   Then the sliders might actually go 0–100 in “internal” units, and 13.887 is valid. We’d show: **“Set H: 13.9, V: 13.9”** (same value for both). No extra math.

2. **If the game maps 0–100 to a different internal range**  
   We need a **display mapping** for that game, e.g.:
   - `sliderToInternal(slider)` and `internalToSlider(internal)`  
   or
   - `internalSensMin`, `internalSensMax` so that  
   `slider = (internal - internalMin) / (internalMax - internalMin) * 100`  
   Then we’d compute our logical sensitivity (13.887) and map it to slider space:  
   **“Set H: 69, V: 69”** (example). This requires per-game research (docs or testing).

3. **Vertical different from horizontal (optional)**  
   If the game supports a separate vertical multiplier (e.g. V = 0.8 × H), we could add:
   - Per-game default: e.g. `verticalSensitivityRatio: 1` (or 0.8), or  
   - User preference: “Vertical sens ratio” for that game.  
   Then display: H = mapped(13.887), V = mapped(13.887 × ratio). Not required for the first version.

### Recommended data model (when implementing)

- **GameData** (in `games.data.ts`):
  - `sensitivitySliders?: 'single' | 'horizontalVertical'`  
    - `'single'`: one value (current behavior).  
    - `'horizontalVertical'`: show same value for H and V (or H and V = H × ratio).
  - Optional: `sliderRange?: { min: number; max: number }` (e.g. `{ min: 0, max: 100 }`).
  - Optional: `internalSensitivityRange?: { min: number; max: number }` or a small formula so we can map **internal sensitivity → slider value** for display. Only add when the game’s UI scale is known.

- **Display / API**  
  - Keep returning one `suggestedSensitivity` from the conversion service.  
  - For UI: if the game has `sensitivitySliders: 'horizontalVertical'`, show two labels (e.g. “H” and “V”) with the same number (or both mapped through `internalToSlider` if we have a range). Optionally format for the slider scale (e.g. round to integer for 0–100).

### Summary

- **Conversion:** Always one number (logical sensitivity). No change to `calculateCm360` / `calculateTargetSensitivity`.
- **Display:** For H/V games, show that one number for both sliders unless we have a slider↔internal mapping; then map and show slider values. Add `sensitivitySliders` (and optional range/mapping) to `GameData` when implementing.
