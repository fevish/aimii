# aimii

aimii.app is a Windows desktop app that normalizes mouse sensitivity across FPS games. It detects the
active game via Overwolf APIs and converts sensitivity settings between games using known formulas. It
displays an in-game overlay widget and supports hotkeys for quick access.

Built with Overwolf-wrapped Electron (`ow-electron`), React, TypeScript, and Webpack.

## Coding Rules

- Use functional components with hooks; no class components
- Prefer object/map lookups over switch statements
- Write DRY code — extract shared logic into reusable hooks, utilities, or components
- Separate responsibilities: keep data fetching, state management, and presentation in distinct layers
- Stay focused on the current task — do not refactor or modify code outside the scope of the prompt
- Follow standard React best practices (proper key usage, memoization where beneficial, controlled components, lifting state appropriately)
- No inline styles; use external CSS files
- Do not poll for state or game detection — use `EventEmitter`; debounce game updates (~200ms)
- Always use `gameInfo.classId` (static) for game identification — never `gameInfo.id` (dynamic session ID)
- Sensitivity conversion math lives exclusively in `src/utils/sensitivity-conversion.ts` — never duplicate formulas

## Project Structure

| Directory/File             | Description                                                                                    |
|----------------------------|------------------------------------------------------------------------------------------------|
| `src/browser/`             | Main process (Electron/Node.js): bootstrapping, IPC, controllers, and services.               |
| `src/browser/controllers/` | One controller per window type (main, widget, aim-trainer, CMP).                              |
| `src/browser/services/`    | Stateful business logic: game detection, sensitivity conversion, hotkeys, settings, etc.       |
| `src/components/`          | Shared React components used across renderer entry points.                                     |
| `src/data/`                | Game database (`games.data.ts`) — sensitivity formulas and metadata for supported games.       |
| `src/constants/`           | Game notes and other static constants.                                                         |
| `src/preload/`             | `preload.ts` — `contextBridge` IPC bridge between main and renderer.                          |
| `src/utils/`               | Shared utility functions.                                                                      |
| `src/types/`               | Shared TypeScript types.                                                                       |
| `public/`                  | Static HTML entry points and assets.                                                           |
| `scripts/`                 | Build and packaging scripts.                                                                   |
| `ROADMAP.md`               | Product and feature roadmap.                                                                   |

Key directories contain a `context.md` with further detail on their contents and conventions.

## Entry Points

The app has multiple renderer entry points and a main process bootstrap:

- `src/browser/index.ts` — main process bootstrap; wires up all services and IPC handlers
- `src/browser/application.ts` — coordinates game injection (overlay), GEP, and window lifecycle
- `src/main.tsx` → `public/main.html` — main desktop app UI
- `src/widget.tsx` → `public/widget.html` — lightweight in-game overlay widget
- `src/aim-trainer-window.tsx` → `public/aim-trainer.html` — 3D aim trainer (currently disabled)

When enabling/disabling the aim trainer, update both `webpack.renderer.config.js` (entry points) and
the `public/aim-trainer.html` inclusion.

## Key Technologies

- React 19, TypeScript
- `@overwolf/ow-electron` (Overwolf-wrapped Electron) — run with `ow-electron .`, not `electron .`
- Webpack 5 (three separate configs composed via `webpack.base.config.js`)
- ESLint with `eslint-config-overwolf-ts` + React hooks rules
- `typescript-logging` for structured logging

## Overwolf Integration Notes

- `overwolf.packages` in `package.json` must list `gep` and `overlay` to activate those packages
- Game injection (overlay) always fires `event.inject()` for all games; allowed games are registered separately in `onOverlayServiceReady`
- The widget window is created/destroyed on game inject/eject events, not at app startup
- GEP (`GameEventsService`) detects game events; `OverlayService` handles injection and widget creation

## Current Focus

We are working through Overwolf QA feedback fixes tracked in `overwolf-fixes.md`. After completing
any item from that list, mark it `[x]` in the doc before finishing.

## Post-Prompt Checklist

After completing every prompt, verify the following before finishing:

- [ ] If new files or directories were created, are they reflected in the **Project Structure** table?
- [ ] If a new entry point or window was added, is it listed in the **Entry Points** section?
- [ ] If existing documented functionality was changed, is `CLAUDE.md` still accurate?

## Other Rules

- Markdown tables must not exceed 150 characters per row. Keep cell text concise to fit within this limit.
- Pad each cell with spaces so all column dividers (`|`) are vertically aligned, including the trailing pipe. The separator row (`---`) should also be padded to match.
- TypeScript target is ES2020; `reflect-metadata` must be imported first in `index.ts`.
