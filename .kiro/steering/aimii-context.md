# Aimii App Development Context

## Project Overview

**aimii.app** is a mouse sensitivity converter application for FPS games that helps gamers maintain consistent aim across different games by converting sensitivity settings using game-specific formulas and scaling ratios.

### Core Problem Solved
Different FPS games use unique formulas and scaling ratios for mouse sensitivity. For example, an in-game sensitivity of `0.5` in Valorant equals approximately `1.591` in Counter-Strike 2. This breaks muscle memory when switching between games.

### Key Features
- **Real-time Game Detection**: Automatically detects when you're playing supported games
- **Cross-Game Sensitivity Conversion**: Convert sensitivity settings between different games using precise formulas
- **Overlay Widget**: In-game overlay showing current sensitivity suggestions
- **Canonical Settings**: Set your preferred game and sensitivity as a baseline for all conversions
- **Hotkey Support**: Toggle widget visibility with customizable hotkeys
- **Manual Calculator**: Convert between any two supported games manually

## Technical Architecture

### Technology Stack
- **Framework**: Electron with React/TypeScript
- **Gaming Integration**: Overwolf platform for gaming overlays
- **Game Detection**: GEP (Game Events Provider) + custom detection
- **Build System**: Webpack with multiple configurations
- **UI**: React components with custom styling
- **State Management**: React Context (being refactored from prop drilling)

### Project Structure
```
aimii/
├── src/                          # Source code
│   ├── browser/                  # Electron main process logic
│   │   ├── controllers/          # IPC controllers
│   │   └── services/             # Business logic services
│   ├── components/               # React components
│   │   ├── MyMainWindow/         # Main application window
│   │   ├── Widget/               # Overlay widget
│   │   ├── Onboarding/           # First-time setup flow
│   │   ├── SettingsFlow/         # Settings configuration
│   │   ├── SensitivityCalculator/ # Manual calculator
│   │   └── [other components]/   # Various UI components
│   ├── data/                     # Game data and configurations
│   ├── types/                    # TypeScript type definitions
│   ├── utils/                    # Utility functions
│   ├── preload/                  # Electron preload scripts
│   └── assets/                   # Static assets (fonts, SVGs)
├── public/                       # Static HTML files
├── dist/                         # Build output
├── .kiro/specs/aimii-modular-refactor/  # Current refactor specification
└── webpack configs               # Build configurations
```

### Core Components (Current)
1. **Main Window**: Primary interface showing game info, settings, and conversions
2. **Overlay Widget**: In-game overlay for real-time sensitivity display
3. **Onboarding Flow**: Initial setup for new users to configure baseline settings
4. **Calculator Modal**: Manual sensitivity conversion between games
5. **Settings/Preferences**: User configuration management

### Key Data Models

**Note**: There are currently inconsistencies between different GameData interfaces in the codebase that need to be resolved during refactoring.

```typescript
// Current GameData interface in src/data/games.data.ts (most complete)
interface GameData {
  game: string;                    # Display name
  processName?: string;            # Process name for detection
  scalingFactor: number;           # Game-specific sensitivity scaling
  owGameId: string;               # Overwolf game ID
  owConstant?: string;            # Overwolf constant identifier
  owGameName?: string;            # Overwolf display name
  enable_for_app: boolean;        # Whether game is supported
  specialConversion?: boolean;     # Uses custom conversion logic
  conversionParams?: ConversionParams; # Parameters for special conversions
}

// ConversionParams for games with special conversion logic
interface ConversionParams {
  linearCoefficient?: number;     # Linear coefficient
  offset?: number;               # Offset value
  multiplier?: number;           # Multiplier for special conversions
  baseValue?: number;            # Base value (for exponential)
  scaleFactor?: number;          # Scale factor (for exponential)
  constant?: number;             # Constant value
}

// Alternative GameData interface in src/types/app.ts (legacy)
interface GameData {
  game: string;
  sensitivityScalingFactor: number; # Different property name!
  owGameId: string;
  owConstant?: string;
  owGameName?: string;
  enable_for_app: boolean;
}

interface BaselineSettings {
  mouseTravel: number;            # cm/360° mouse travel distance (PRIMARY metric)
  dpi: number;                    # Mouse DPI
  trueSens: number;               # Derived: Math.round(mouseTravel * 10)
  favoriteGame: string;           # User's preferred game
  favoriteSensitivity: number;    # Sensitivity in favorite game
  eDPI: number;                   # Derived: dpi * favoriteSensitivity (display only)
}

interface SensitivityConversion {
  gameName: string;
  suggestedSensitivity: number;
  mouseTravel: number;
  userDPI: number;
  trueSens: number;
}
```

## Current Architecture Issues (Being Addressed)

### Problems Identified
1. **Component Duplication**: Similar UI patterns implemented multiple times
2. **Tight Coupling**: Components directly manage complex state and business logic
3. **Inconsistent Patterns**: Different approaches for similar functionality
4. **Service Fragmentation**: Business logic scattered across components
5. **State Management Complexity**: Prop drilling and inconsistent state updates
6. **Code Redundancy**: Duplicate implementations of sensitivity calculations, game displays, settings flows
7. **Type Inconsistencies**: Multiple GameData interfaces with different property names (scalingFactor vs sensitivityScalingFactor)
8. **Data Model Misalignment**: Types in src/types/app.ts don't match actual data structure in src/data/games.data.ts

### Refactoring Goals
- Create reusable, modular components
- Implement unified service layer architecture
- Establish consistent state management patterns
- Eliminate code duplication
- Improve error handling and testing support
- Maintain backward compatibility

## Development Guidelines

### Code Organization Principles
1. **Feature-Based Structure**: Group related components in feature directories
2. **Service Layer Separation**: Keep business logic in dedicated service classes
3. **Component Reusability**: Create shared components for common UI patterns
4. **Context-Based State**: Use React Context instead of prop drilling
5. **Consistent Error Handling**: Standardized error patterns across the app

### Modularity and Consistency Guidelines
1. **Always Follow Established Patterns**: When adding new functionality, look for existing patterns in the codebase and follow them consistently
2. **Component-First Approach**: Break down complex UI into smaller, reusable components rather than creating monolithic components
3. **Extract Common Logic**: If you see similar code in multiple places, extract it into shared utilities, hooks, or services
4. **Suggest Improvements**: Actively identify opportunities to reduce redundancy and improve modularity - don't just implement features, improve the codebase
5. **Think Future-Friendly**: Consider how changes will affect future development - make code extensible and maintainable

### Proactive Development Mindset
- **Identify Redundancy**: When working on any component, look for duplicate code patterns and suggest consolidation
- **Propose Abstractions**: If you notice repeated UI patterns, suggest creating shared components
- **Recommend Refactoring**: Point out opportunities to improve code organization, even if not directly related to the current task
- **Consider Scalability**: Think about how new features will scale and suggest architectural improvements
- **Enhance Developer Experience**: Look for ways to make the codebase more developer-friendly (better types, clearer interfaces, etc.)

### Key Services (Target Architecture)
- **GameService**: All game-related operations and data management
- **SensitivityService**: Sensitivity calculations and conversions
- **SettingsService**: User preferences and configuration management
- **GameDetectionService**: Unified game detection (GEP + custom)

### Shared Components (Target Architecture)
- **SensitivityDisplay**: Unified sensitivity information display
- **GameSelector**: Reusable game selection with search/filtering
- **SettingsFlow**: Multi-step settings configuration
- **UserPreferences**: Display and manage baseline settings
- **SensitivityCalculator**: Manual conversion calculator

### Context Providers (Target Architecture)
- **AppContext**: Global application state and configuration
- **GameContext**: Game detection and current game state
- **SettingsContext**: User settings and preferences
- **SensitivityContext**: Sensitivity calculations and conversions

## Sensitivity Calculation Logic

### Core Formula
The app uses mouse travel distance (cm/360°) as the universal baseline for conversions:

1. **Calculate mouse travel from source game**: `mouseTravel = (dpi * sensitivity * scalingFactor) / 2.54`
2. **Calculate target sensitivity**: `targetSens = (mouseTravel * 2.54) / (dpi * targetScalingFactor)`

### Special Conversions
Some games require custom conversion logic beyond simple scaling factors, handled through `specialConversion` flag and `conversionParams`.

### Key Metrics
- **Mouse Travel (cm/360°)**: Distance mouse moves for 360° turn
- **True Sens**: Normalized sensitivity value for comparison
- **eDPI**: Effective DPI (sensitivity × mouse DPI)

## Game Detection System

### Detection Methods
1. **GEP (Game Events Provider)**: Overwolf's game detection system
2. **Custom Detection**: Process name matching for additional games
3. **Manual Selection**: User can manually set current game

### Supported Games
The app maintains a database of supported games with their specific scaling factors and detection parameters.

## User Experience Flow

### First-Time Setup (Onboarding)
1. Welcome screen explaining the app's purpose
2. Game selection (user's primary/favorite game)
3. Sensitivity input for selected game
4. DPI configuration
5. Baseline calculation and confirmation

### Daily Usage
1. App detects current game automatically
2. Shows suggested sensitivity based on user's baseline
3. Overlay widget displays sensitivity in-game
4. Manual calculator available for ad-hoc conversions

## Development Best Practices

### When Working on aimii
1. **Always Reference Specs**: Check `.kiro/specs/aimii-modular-refactor/` for current requirements and design
2. **Maintain Backward Compatibility**: Existing user settings must continue working
3. **Test Sensitivity Calculations**: Verify math accuracy with known game conversions
4. **Consider Game Detection**: Ensure changes don't break game detection functionality
5. **Preserve User Experience**: UI changes should maintain familiar workflows
6. **Follow Modular Patterns**: Use shared components and services when possible
7. **Address Type Inconsistencies**: Be aware of GameData interface mismatches between files
8. **Use Correct Data Structure**: Reference src/data/games.data.ts for the actual GameData structure
9. **Actively Suggest Improvements**: Don't just implement - look for opportunities to improve modularity, reduce redundancy, and enhance maintainability
10. **Component Extraction**: If you see repeated UI patterns, suggest extracting them into reusable components
11. **Service Consolidation**: When touching business logic, consider if it should be moved to a centralized service
12. **Future-Proof Changes**: Make implementations that will be easy to extend and modify for future features

### Testing Considerations
- **Sensitivity Math**: Verify calculations with real-world game examples
- **Game Detection**: Test with actual game processes when possible
- **User Settings**: Ensure settings persistence and migration
- **Cross-Game Compatibility**: Test conversions between multiple games
- **Overlay Functionality**: Verify overlay works in gaming contexts

### Performance Considerations
- **Real-time Updates**: Sensitivity calculations should be fast for real-time display
- **Memory Usage**: Minimize memory footprint for overlay widget
- **Game Detection**: Efficient polling without impacting game performance
- **Startup Time**: Quick app initialization for gaming workflows

## Common Patterns and Utilities

### Validation Patterns
- DPI validation (typically 100-20000 range)
- Sensitivity validation (game-specific ranges)
- Game data validation (required fields, scaling factors)

### Error Handling
- Network errors for game data updates
- Calculation errors for invalid inputs
- Game detection failures
- Settings persistence errors

### State Management
- Loading states for async operations
- Error states with user-friendly messages
- Optimistic updates for better UX
- Debounced inputs for performance

## Integration Points

### Overwolf Integration
- Game detection via GEP
- Overlay rendering in games
- Hotkey management
- Window management

### Electron Integration
- IPC communication between main/renderer
- File system access for settings
- System tray integration
- Auto-updater functionality

## File References

### Key Configuration Files
- `package.json`: Project metadata and dependencies
- `webpack.*.config.js`: Build configurations (base, main, renderer)
- `src/data/games.data.ts`: Game database with scaling factors and conversion parameters
- `tsconfig.json`: TypeScript configuration
- `.eslintrc.json`: ESLint configuration

### Specification Files
- `.kiro/specs/aimii-modular-refactor/requirements.md`: Detailed requirements
- `.kiro/specs/aimii-modular-refactor/design.md`: Architecture design
- `.kiro/specs/aimii-modular-refactor/tasks.md`: Implementation tasks (when created)

### Important Source Files
- `src/browser/`: Electron main process logic and services
- `src/components/`: React application components
- `src/types/`: TypeScript type definitions
- `src/data/games.data.ts`: Game database with scaling factors
- `src/my-main.tsx`: Main window entry point
- `src/widget.tsx`: Overlay widget entry point
- `src/preload/preload.ts`: Electron preload script for IPC

## Development Workflow

### Before Making Changes
1. Review relevant specification documents
2. Understand impact on existing functionality
3. Consider backward compatibility requirements
4. Plan for testing approach

### During Development
1. Follow established patterns and conventions
2. Maintain code modularity and reusability
3. Add appropriate error handling
4. Consider performance implications

### After Changes
1. Test sensitivity calculations thoroughly
2. Verify game detection still works
3. Check overlay functionality
4. Ensure settings persistence
5. Test user workflows end-to-end

This context file should be referenced for all aimii development work to ensure consistency and understanding of the project's goals, architecture, and constraints.
#
# Current Known Issues

### Type System Inconsistencies
- **GameData Interface Mismatch**: Two different GameData interfaces exist:
  - `src/data/games.data.ts`: Uses `scalingFactor` property (correct, matches actual data)
  - `src/types/app.ts`: Uses `sensitivityScalingFactor` property (outdated)
- **Missing Properties**: The types/app.ts version is missing several properties that exist in the actual data:
  - `processName`, `owConstant`, `owGameName`, `specialConversion`, `conversionParams`

### Component Architecture Issues
- **Duplicate GameData Definitions**: Several components define their own GameData interfaces instead of importing from a central location
- **Inconsistent Import Patterns**: Some components import from `src/data/games.data.ts`, others from `src/types/app.ts`
- **Service Layer Fragmentation**: Business logic is scattered across components rather than centralized in services

### Immediate Priorities for Refactoring
1. **Unify GameData Interface**: Consolidate all GameData definitions to use the complete interface from games.data.ts
2. **Update Type Imports**: Ensure all components import types from the correct, authoritative source
3. **Centralize Business Logic**: Move sensitivity calculations and game operations to dedicated services
4. **Establish Consistent Patterns**: Create shared components for common UI patterns

### Testing Considerations
- **Sensitivity Math Verification**: Current games database includes complex conversion parameters for games like PUBG, Minecraft, GTA V that use special formulas
- **Type Safety**: Refactoring must ensure type safety across all GameData usages
- **Backward Compatibility**: User settings and saved data must continue working after type unification
## I
mprovement Opportunities to Watch For

### Common Refactoring Patterns
When working on aimii, actively look for these improvement opportunities:

#### Component Extraction Opportunities
- **Repeated UI Patterns**: Game selection dropdowns, sensitivity input fields, loading states, error messages
- **Complex Components**: Large components that handle multiple responsibilities should be broken down
- **Conditional Rendering**: Complex conditional UI logic that could be extracted into separate components
- **Form Patterns**: Repeated form validation and state management patterns

#### Service Consolidation Opportunities
- **Scattered Business Logic**: Calculations or data transformations happening in multiple components
- **API Calls**: Direct API/IPC calls in components that should be abstracted into services
- **State Management**: Complex state logic that could be moved to context providers or custom hooks
- **Validation Logic**: Repeated validation patterns that could be centralized

#### Code Organization Improvements
- **File Structure**: Components or utilities that don't follow the established directory structure
- **Import Patterns**: Inconsistent import paths or circular dependencies
- **Type Definitions**: Missing or inconsistent TypeScript types
- **Naming Conventions**: Inconsistent naming that could be standardized

#### Performance and Maintainability
- **Unnecessary Re-renders**: Components that could benefit from memoization or better state structure
- **Bundle Size**: Opportunities to lazy load components or optimize imports
- **Error Boundaries**: Missing error handling that could be improved with proper boundaries
- **Testing Gaps**: Code that would benefit from better testability through improved structure

### Proactive Suggestions Framework
When implementing any feature or fix, consider suggesting:

1. **"While working on X, I noticed Y could be improved by Z"**
2. **"This pattern appears in multiple places - should we extract it into a shared component?"**
3. **"The business logic here could be moved to a service for better reusability"**
4. **"This component is getting complex - we could break it down into smaller pieces"**
5. **"I see an opportunity to reduce code duplication by creating a shared utility"**

### Developer Experience Enhancements
Look for opportunities to improve the development experience:
- **Better TypeScript Types**: More specific types that catch errors at compile time
- **Clearer Interfaces**: Well-documented props and service interfaces
- **Consistent Patterns**: Standardized approaches for common tasks
- **Helpful Utilities**: Shared functions that make common operations easier
- **Better Error Messages**: More descriptive error handling and validation messages

Remember: The goal is not just to implement features, but to continuously improve the codebase's modularity, maintainability, and developer experience. Every interaction with the code is an opportunity to make it better for future development.
# Develo
pment Rules and Guidelines

## Core Development Rules
- **Always use**: aimii (lower case)
- **Based on**: overwolf-electron sample (not native Overwolf)
- **Overlay + GEP**: confirmed working
- **Never make git commits** via assistant
- **The agent/assistant should NEVER add CSS**, let the user handle this
- **The agent/assistant should never try to build the app or run NPM or YARN commands**, just prompt the user to do it.

## Core Principles
- **Event-driven** (no polling); debounce updates (≈200ms for game changes)
- **Single instance**; DevTools detached and manual (Ctrl+Shift+I)
- **Use Overwolf gameInfo.classId** (never gameInfo.id)
- **Keep logic in services**; UI consumes via IPC/preload

## Canonical Settings (BaselineSettings)
- **mouseTravel** (cm/360°)
- **dpi**
- **trueSens** = Math.round(mouseTravel × 10)
- **favoriteGame** (string)
- **favoriteSensitivity** (number)
- **eDPI** = dpi × favoriteSensitivity

**Storage**: SettingsService persists baseline; baseline getter is enriched with trueSens (and eDPI via migration if needed).

## Services Architecture (src/browser/services)
- **CurrentGameService**: event-driven game detection (GEP-first), debounced
- **GamesService**: game data + conversions (cm/360 and target sensitivity)
- **SensitivityConverterService**:
  - getSuggestedSensitivityForCurrentGame()
  - getAllConversionsFromBaseline()
  - calculateMouseTravelFromGame(game, sens, dpi)
  - calculateTrueSens(mouseTravel) = round(cm × 10)
- **SettingsService**: baseline, widget, hotkeys, theme
- **OverlayService**: optimized registration/injection; coordinates with GEP

## IPC/preload (selected)
### settings:
- getBaselineSettings() → BaselineSettings (with trueSens/eDPI)
- setBaselineSettings(mouseTravel, dpi, favoriteGame?, favoriteSensitivity?, eDPI?) → boolean
- hasBaselineSettings(), clearBaselineSettings()

### currentGame:
- getCurrentGameInfo(), getAllDetectedGames(), onGameChanged()

### sensitivityConverter:
- getSuggestedForCurrentGame(), getAllConversionsFromBaseline()
- calculateMouseTravelFromGame(game, sens, dpi)
- getCurrentMouseTravel(), getTrueSens()

## UI Components
- **MyMainWindow**: parallel data load; real-time updates; suggestions
- **Widget**: compact; listens for baseline changes
- **SettingsFlow** (3 steps: game, sens, dpi)
  - **Onboarding**: normal Next/Back
  - **Preferences**: Back on step 1 closes flow; Back on steps 2–3 navigates back
- **UserPreferencesContent**: shows canonical settings; opens SettingsFlow (context="preferences")

## Game Detection
- **Primary**: GEP (O(1) Set) with auto-features
- **Secondary**: overlay injection; both normalize to classId strings

## Performance Guidelines
- Debounce game updates; minimal settings sync
- O(1) ID lookups; Promise.all for parallel loads

## Code Conventions
- **TypeScript throughout**; shared types in src/types
- **No inline styles**; use CSS
- **Do not recompute conversions in UI**; use services via IPC

## Maintenance Notes
- Unify BaselineSettings type usage: import from src/types/app.ts in backend
- Consider PreferencesContext and ConversionContext in renderer to centralize access and reduce duplication

## Commit Message Format
- ≤50 chars, e.g.: "add eDPI to baseline", "fix prefs back behavior"

## Demo Cleanup
- **Demo-related IPC handlers**: Cleaned up demo-specific IPC communication

This ensures the rules remain accurate and helpful for future development.