---
description: SearchableSelect component, game search, game select, game dropdown, game picker
globs:
alwaysApply: false
---

# SearchableSelect – Game Search/Select Rule

## Mandatory Usage

**ALWAYS** use the `SearchableSelect` component (`src/components/SearchableSelect/SearchableSelect.tsx`) for any game search, game select, game dropdown, or game picker across the app.

Do **NOT** use a plain `<select>`, custom input, or other component for game selection. `SearchableSelect` provides:
- Search/filter as the user types
- Keyboard navigation (Arrow keys, Enter, Escape)
- Large game list handling
- Consistent UX across onboarding, preferences, calculator, aim trainer, etc.

## Usage

Convert games to the options format before passing to `SearchableSelect`:

```tsx
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';

// Convert games to options format
const gameOptions = games
  .filter(g => g.enable_for_app)  // or omit if all games
  .map(game => ({
    value: game.game,
    label: game.game
  }));

<SearchableSelect
  id="game-select"
  value={selectedGame}
  options={gameOptions}
  placeholder="Select a game"
  onChange={(value) => onGameChange(value)}
  onKeyDown={handleKeyDown}  // optional, for Enter-to-continue etc.
  required={false}
  disabled={false}
  className=""
/>
```

## Where to Use

- **Onboarding** – Game selection step (via `GameSelectionStep`)
- **Preferences / Mouse Travel** – Reference game selection (via `SettingsFlow` → `GameSelectionStep`)
- **Calculator** – "Convert From" and "Convert To" game selects
- **Aim Trainer** – Emulate game dropdown (if not already using it)
- **Any future feature** that requires selecting a game from the list

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `id` | string | Yes | Unique id for the input (accessibility, focus) |
| `value` | string | Yes | Selected value (game name) |
| `options` | `{ value: string; label: string }[]` | Yes | Options list |
| `onChange` | `(value: string) => void` | Yes | Called when selection changes |
| `placeholder` | string | No | Default: "Select an option" |
| `onKeyDown` | `(e: React.KeyboardEvent) => void` | No | For Enter-to-proceed, focus control |
| `required` | boolean | No | Default: false |
| `disabled` | boolean | No | Default: false |
| `className` | string | No | Additional CSS classes |

## Behavior Notes

- **Escape**: Clears selection when a value is selected; closes dropdown otherwise.
- **Read-only when selected**: Input becomes read-only after selection; user can clear via the X button or Escape.
- **Filtering**: Case-insensitive search on `label`.
