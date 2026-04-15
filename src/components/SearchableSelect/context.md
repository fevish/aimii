# src/components/SearchableSelect/ — Game Selection

Always use `SearchableSelect` for any game search, game select, game dropdown, or game picker
across the app. Do not use a plain `<select>` or custom input for game selection.

## Usage

```tsx
import { SearchableSelect } from '../SearchableSelect/SearchableSelect';

const gameOptions = games
  .filter(g => g.enable_for_app)
  .map(game => ({ value: game.game, label: game.game }));

<SearchableSelect
  id="game-select"
  value={selectedGame}
  options={gameOptions}
  placeholder="Select a game"
  onChange={(value) => onGameChange(value)}
  onKeyDown={handleKeyDown}  // optional — for Enter-to-continue etc.
/>
```

Data source: `window.games.getEnabledGames()` in the main window, or the `games` prop passed down
the tree. Import `GameData` from `src/types/app`.

## Props

| Prop        | Type                              | Required | Description                              |
|-------------|-----------------------------------|----------|------------------------------------------|
| `id`        | string                            | Yes      | Unique id (accessibility, focus)         |
| `value`     | string                            | Yes      | Selected game name                       |
| `options`   | `{ value: string; label: string }[]` | Yes   | Options list                             |
| `onChange`  | `(value: string) => void`         | Yes      | Called when selection changes            |
| `placeholder` | string                          | No       | Default: "Select an option"              |
| `onKeyDown` | `(e: React.KeyboardEvent) => void`| No       | For Enter-to-proceed, focus control      |
| `required`  | boolean                           | No       | Default: false                           |
| `disabled`  | boolean                           | No       | Default: false                           |
| `className` | string                            | No       | Additional CSS classes                   |
| `searchable`| boolean                           | No       | Default: true. When false, disables type-to-filter (acts as a plain dropdown) |

## Behavior

- **Escape:** clears selection when value is set; closes dropdown otherwise
- **Read-only when selected:** input becomes read-only; user clears via X button or Escape
- **Filtering:** case-insensitive search on `label`
- Handles large game lists; supports keyboard navigation (Arrow keys, Enter, Escape)

## Where it's used

Onboarding game selection, Preferences/Mouse Travel reference game, Calculator "Convert From"/"Convert To",
Aim Trainer emulate-game dropdown, and any future feature requiring a game picker.
