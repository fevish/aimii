---
description: Project context and rules for overwolf-electron sample and custom app development.
globs:
  - "**/*"
alwaysApply: true
- This project is based on the overwolf-electron sample app (NOT Overwolf Native).
- All code and configuration is for overwolf-electron, not native Overwolf.
- Game events and in-game overlays are confirmed to work in this setup.
- The existing sample app files are to be kept for reference on how to use overwolf-electron APIs, game events, and overlays.
- When building new features or the new app, use the sample files as reference only; new app code should be completely separate.
- Do not remove or modify the sample files unless explicitly requested; they serve as a working reference for overwolf-electron usage.
- Never use inline styles in any code. Always use a CSS file

## aimii - Mouse Sensitivity Noramlizer App

### Project Overview
aimii is a complete overwolf-electron mouse sensitivity normalizer application with real-time game detection, event-driven architecture, and both main window and overlay widget interfaces.

### Core Architecture

#### Services Layer (`src/browser/services/`)
- **CurrentGameService**: Event-driven game detection using Overwolf events (`game-injected`, `game-launched`, `game-focus-changed`)
  - Extends EventEmitter for real-time notifications
  - Uses `gameInfo.classId` (NOT `gameInfo.id`) for game matching - this is critical
  - Auto-injects overlay for supported games
  - Eliminates polling overhead with pure event-driven detection

- **SensitivityConverterService**: Cross-game sensitivity calculations
  - Uses existing GamesService conversion methods for accuracy
  - Smart logic: shows current settings when playing canonical game, suggests conversion for other supported games
  - Calculates cm/360° for consistency verification

- **GamesService**: Game configuration management from `games.json`
  - Maps Overwolf game IDs to internal game data
  - Provides conversion factors and game metadata

- **SettingsService**: Persistent canonical settings storage
  - User's preferred game, sensitivity, and DPI as conversion baseline
  - Widget position and visibility state persistence

- **OverlayService**: Overwolf overlay API management
  - Game injection and overlay window creation
  - Event registration and management

#### Controllers Layer (`src/browser/controllers/`)
- **MainWindowController**: Central coordination hub
  - Manages all service dependencies and IPC handlers
  - Listens for game changes and broadcasts to UI components via IPC
  - Handles widget creation and management

- **WidgetWindowController**: Overlay widget management
  - Centralized hotkey configuration (Ctrl+Shift+M for toggle, Ctrl+Shift+I for dev tools)
  - Position persistence and bounds checking
  - Overlay window lifecycle management

#### UI Components
- **MyMainWindow** (`src/components/MyMainWindow/`): Main application interface
  - Canonical settings configuration
  - Real-time game status display
  - Sensitivity suggestions for current game
  - Dark theme with glassmorphism effects

- **Widget** (`src/components/Widget/`): Overlay widget
  - Compact game info display
  - Real-time sensitivity suggestions
  - Minimal, non-intrusive design

### Event-Driven Architecture
- **Game Detection**: Pure event-driven using Overwolf events (no polling)
- **UI Updates**: IPC events (`current-game-changed`) for instant UI refresh
- **Settings Sync**: Minimal polling (10-15s) only for settings changes
- **Performance**: Smart state updates prevent unnecessary re-renders

### Key Technical Patterns

#### IPC Communication
- Main window uses contextIsolation:true with preload script APIs
- Widget uses contextIsolation:false with direct electron access
- Centralized IPC handlers in MainWindowController
- Event broadcasting for real-time updates

#### Game ID Handling (CRITICAL)
**IMPORTANT**: When working with Overwolf game detection, always use `gameInfo.classId` for game identification, NOT `gameInfo.id`.

- `gameInfo.id` - Runtime instance ID (changes each time game launches, e.g., 216401)
- `gameInfo.classId` - Actual Overwolf game ID (static, matches games.json, e.g., 21640)

```typescript
// CORRECT - Use classId for game matching
const activeGame = overlayService.overlayApi?.getActiveGameInfo();
const overwolfGameId = activeGame.gameInfo.classId?.toString();

// WRONG - Don't use id (runtime instance ID)
const wrongId = activeGame.gameInfo.id; // This changes per game launch
```

The `owGameId` field in `games.json` corresponds to Overwolf's `gameInfo.classId`.

#### State Management
- Functional setState with change detection to prevent unnecessary renders
- Smart comparison of key properties before state updates
- Proper cleanup of event listeners and intervals

### Styling System
- Dark theme: `#23272e` backgrounds, `#181a20` darker areas, `#e0e0e0` text
- Yellow accent color: `#ffb347` for highlights and active states
- Glassmorphism effects with backdrop-filter
- No inline styles - external CSS only
- Consistent styling between main window and widget

### Development Patterns
- TypeScript interfaces for all data structures
- Proper error handling and logging
- Modular service architecture with dependency injection
- Event-driven communication over polling
- Centralized configuration (hotkeys, themes, etc.)

### File Structure
```
src/
├── browser/
│   ├── services/          # Core business logic
│   ├── controllers/       # IPC and window management
│   └── index.ts          # Dependency injection setup
├── components/
│   ├── MyMainWindow/     # Main application UI
│   └── Widget/           # Overlay widget UI
├── preload/              # Context bridge APIs
└── games.json           # Game configuration data
```

### Performance Optimizations
- Event-driven game detection (eliminated 2-5s polling)
- Smart state updates with change detection
- Debounced position saving
- Minimal polling only where necessary (settings sync)

### Future Development Notes
- All game-related logic should use CurrentGameService events
- New UI components should follow the dark theme pattern
- IPC handlers should be centralized in MainWindowController
- Always use gameInfo.classId for game identification
- Maintain the event-driven architecture pattern



