# src/utils/ — Utilities

## sensitivity-conversion.ts

Single implementation of all sensitivity math. No Electron/browser dependencies — safe to import
from both main process and renderer.

**Two exported functions:**
- `calculateCm360(game, sensitivity, dpi)` — in-game sens + DPI → cm/360°
- `calculateTargetSensitivity(game, cm360, targetDPI)` — cm/360° + DPI → in-game sens

Do not duplicate conversion formulas anywhere else. Both `GamesService` (main) and
`SensitivityCalculator` (renderer) use this shared util.

### Why cm/360°?

In-game sensitivity numbers are arbitrary and game-specific. Physical mouse travel for a 360° turn
is hardware-agnostic and game-agnostic — it's the universal baseline aimii uses for all conversions.

### Standard formula

For games without `specialConversion`:

```
// Source game → cm/360
inches360 = 360 / (scalingFactor * sensitivity * dpi)
cm360     = inches360 * 2.54

// cm/360 → target game
inches360   = cm360 / 2.54
targetSens  = 360 / (scalingFactor * targetDPI * inches360)
```

### Special conversions

Games with `specialConversion: true` in `games.data.ts` use `conversionParams` for custom formulas.
Currently in the dataset:
- **PUBG** — exponential formula via `baseValue` / `scaleFactor` (enabled)
- **Minecraft Java** — linear-with-offset via `linearCoefficient` / `offset` / `multiplier` (disabled)

`sensitivity-conversion.ts` contains additional formula branches (e.g. `constant`/`offset`,
cubic, etc.) that no current game uses but remain in place for future additions.

### Derived metrics

- **True Sens**: `Math.round(mouseTravel * 10)` — normalized for comparison
- **eDPI**: `dpi * sensitivity` — display metric only, not used in conversion math
