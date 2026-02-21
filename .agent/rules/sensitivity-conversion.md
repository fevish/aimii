---
trigger: always_on
---

# Sensitivity Conversion Architecture

This document explains the math powering the aimsii converter.

## The Universal Metric: `cm/360°`
Aimsii uses physical mouse travel distance (`cm/360°`) as the universal baseline to convert sensitivity between any two games.

**Why cm/360?**
In-game sensitivity multipliers are arbitrary. A "1.0" in CS2 is vastly different from a "1.0" in Overwatch. However, the physical distance required to turn your character 360 degrees in-game is a fixed absolute metric.

## The Standard Formula
For games with linear sensitivity scaling:
1.  **Source to cm/360**:
    `inches360 = 360 / (game.scalingFactor * sensitivity * dpi)`
    `cm360 = inches360 * 2.54`

2.  **cm/360 to Target**:
    `inches360 = cm360 / 2.54`
    `targetSens = 360 / (game.scalingFactor * targetDPI * inches360)`

## Special Conversions
Some games (like PUBG, Minecraft, Battlefield) use exponential, logarithmic, or complex offset formulas instead of a linear multiplier.
These are flagged by `specialConversion: true` in `games.data.ts`.

### Mathematical Interfaces
If `specialConversion` is true, a `conversionParams` object MUST be provided.
-   `linearCoefficient` (e.g., `0.0015` in Battlefield)
-   `offset`
-   `multiplier`
-   `baseValue` / `scaleFactor` (used for exponential math like PUBG)
-   `constant`

`GamesService.calculateCm360` and `calculateTargetSensitivity` explicitly map these parameters to the correct algebraic inverse functions. **Never modify standard formulas without thorough unit testing.**
