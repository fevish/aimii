# src/browser/services/ — Services

Each service owns a specific domain of business logic. Services communicate via EventEmitter —
no polling for game state or detection.

## Service Map

| Service                         | Responsibility                                              |
|---------------------------------|-------------------------------------------------------------|
| `games.service.ts`              | Game list from `games.data.ts`, filtering, conversion API   |
| `sensitivity-converter.service.ts` | Baseline → current game sens; onboarding (sens+DPI → cm/360) |
| `current-game.service.ts`       | Tracks active game; coordinates GEP + custom detector      |
| `gep.service.ts`                | Overwolf GEP game events                                    |
| `custom-game-detector.service.ts` | `tasklist` fallback detector keyed on `processName`       |
| `overlay.service.ts`            | Overwolf overlay injection; widget window lifecycle        |
| `hotkey.service.ts`             | Global hotkey registration                                  |
| `settings.service.ts`           | User preference persistence                                 |
| `window-state.service.ts`       | Window position/size persistence                            |
| `cmp.service.ts`                | GDPR / CMP (EU users only)                                  |

Conversion math is **not** in `GamesService` — it delegates to `src/utils/sensitivity-conversion.ts`.

## Event-Driven Rule

Do not poll for game detection or state changes. Use `EventEmitter`. Debounce game updates (~200 ms).

## Ad Detection (`AdService`)

> Feature: detect when Overwolf ads are running and apply `.ad-running` to `terminal-container`.

- Listen to Overwolf ad events (`ad-started`, `ad-completed`) — no polling
- Apply/remove `.ad-running` CSS class on state change; clean up listeners on unmount
- Debounce state updates to prevent excessive re-renders
- Graceful fallback: if detection fails, assume no ad running and continue normally
- Expose state via `AdContext` provider; components subscribe through context, not direct service calls

## aim-trainer/

See [aim-trainer/context.md](aim-trainer/context.md) for engine architecture and performance rules.
