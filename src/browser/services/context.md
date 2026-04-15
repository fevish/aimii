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

## Ad Detection

Implemented as a hook, not a service: `src/components/MainWindow/useAdDetection.ts`.

- Watches `owadview` DOM element events: `play`, `display_ad_loaded`, `player_loaded` → adds `.ad-running` to `.ad-section`
- `complete` event → removes `.ad-running`
- Waits for `dom-ready` on the WebView before attaching listeners if needed
- Cleans up all listeners on unmount

## aim-trainer/

See [aim-trainer/context.md](aim-trainer/context.md) for engine architecture and performance rules.
