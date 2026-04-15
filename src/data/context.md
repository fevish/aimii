# src/data/ — Game Data

## `games.data.ts`

The single source of truth for all supported games. Defines the `GameData` interface and `gamesData`
array. `GameData` is re-exported from `src/types/app.ts` — always import from there.

### Required fields per game entry

| Field              | Type      | Description                                                          |
|--------------------|-----------|----------------------------------------------------------------------|
| `game`             | string    | Display name                                                         |
| `scalingFactor`    | number    | Raw scalar for cm/360 ↔ in-game sens conversion                      |
| `owGameId`         | string    | Overwolf classId — used by GEP and overlay injection. Use `'0'` if unknown. |
| `enable_for_app`   | boolean   | Whether the game appears in lists and triggers detection             |
| `processName`      | string?   | `.exe` name (e.g. `cs2.exe`) — optional but strongly recommended    |
| `specialConversion`| boolean?  | `true` if the game uses a custom formula instead of the standard one |
| `conversionParams` | object?   | Parameters for the custom formula (see sensitivity-conversion.ts)   |

### Special conversion params

Games with `specialConversion: true` use `conversionParams` in the conversion util:
- `linearCoefficient`, `offset`, `multiplier` — e.g. Battlefield
- `constant`, `offset` — e.g. GTA5
- `baseValue`, `scaleFactor` — e.g. PUBG (exponential)

Never change conversion formulas without verifying against known real-world values.

## Detection Pipeline

`CurrentGameService` runs a dual-detector system:

### 1. GEP (Game Events Provider)
- `gep.service.ts` uses Overwolf's official API
- Relies on `owGameId` (classId — static, not session ID)
- Limitation: some games may have an overlay ID but GEP still fails to hook

### 2. Custom Game Detector (fallback)
- `custom-game-detector.service.ts` runs `tasklist /FO CSV` and matches `processName`
- Acts as fallback for **any** game with a `processName`, even if it has a valid `owGameId`
- Catches cases where GEP fails to hook (e.g. CS2 intermittently)

**Best practice:** Always define `processName` for any major title, even if Overwolf formally supports
it, to guarantee detection resilience.
