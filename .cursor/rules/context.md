---
globs:
alwaysApply: true
---

# Aimii App Development Context

## Update this file
The agent is to update aimii-context.md with the latest information and context as we add or change features.

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

### Core Components (Current)
1. **Main Window**: Primary interface showing game info, settings, and conversions
2. **Overlay Widget**: In-game overlay for real-time sensitivity display
3. **Onboarding Flow**: Initial setup for new users to configure baseline settings
4. **Calculator Modal**: Manual sensitivity conversion between games
5. **Settings/Preferences**: User configuration management
6. **Aim Trainer**: Integrated 3D aim training mode (fps-optimized)

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
- **CMPService**: GDPR compliance and privacy management for EU users
- **AimTrainer Services**: Collection of modular services (`InputService`, `EnvironmentService`, `TargetService`, `MovementService`) managing the 3D trainer engine.

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
- **Consent Management Platform (CMP)**: GDPR compliance for EU users

### CMP (Consent Management Platform) Integration
**Full GDPR compliance implementation following Overwolf's CMP requirements:**

#### **Layer 1 (First-Time Notice)**
- **Location**: NSIS installer + Onboarding component
- **Purpose**: Initial consent notice for EU users
- **Implementation**:
  - Installer shows CMP notice during installation (registry: `HKCU\Software\aimii\GDPRRegion`)
  - Onboarding component conditionally shows "Privacy Settings" link
  - Only displays for EU users detected via `app.overwolf.isCMPRequired()`

#### **Layer 2 (Detailed Privacy Settings)**
- **Location**: Settings component privacy section
- **Purpose**: Full privacy controls and vendor management
- **Implementation**:
  - "Privacy Settings" button in app settings
  - Opens Overwolf's Ad Privacy Settings window via `app.overwolf.openAdPrivacySettingsWindow()`
  - Provides granular consent controls for data collection and vendors

#### **CMP Service Architecture**
```typescript
// Core CMP service: src/browser/services/cmp.service.ts
class CMPService {
  async isCMPRequired(): Promise<boolean>        // EU detection
  async openPrivacySettings(): Promise<void>    // Layer 2 access
  async isFirstTimeUser(): Promise<boolean>     // First-time detection
}

// IPC integration: src/browser/controllers/cmp.controller.ts
// Preload exposure: window.cmp API for renderer processes
```

#### **Detection Logic**
1. **Registry Check**: Installer sets `GDPRRegion` flag for EU users
2. **Overwolf API Fallback**: Uses `app.overwolf.isCMPRequired()` if no registry
3. **Safety Default**: Defaults to showing CMP if detection fails
4. **Test Mode**: `TEST_EU_USER` flag for development testing

#### **User Experience Flow**
- **Non-EU Users**: No privacy links shown (clean interface)
- **EU Users**: Privacy links in both onboarding and settings
- **First-Time EU Users**: CMP notice during installation + onboarding
- **Returning EU Users**: Access via settings privacy section

#### **Compliance Features**
- ✅ **Overwolf API Integration**: Uses official `isCMPRequired()` and `openAdPrivacySettingsWindow()`
- ✅ **Two-Layer Implementation**: Installation notice + detailed settings
- ✅ **Conditional UI**: Privacy controls only for users who need them
- ✅ **Proper Error Handling**: Graceful fallbacks and safety defaults
- ✅ **Test Infrastructure**: Development flags for testing EU functionality

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
### Important Source Files
- `src/browser/`: Electron main process logic and services
- `src/browser/services/aim-trainer/`: Core logic for Aim Trainer engine
- `src/components/`: React application components
- `src/types/`: TypeScript type definitions
- `src/data/games.data.ts`: Game database with scaling factors
- `src/my-main.tsx`: Main window entry point
- `src/widget.tsx`: Overlay widget entry point
- `src/preload/preload.ts`: Electron preload script for IPC

### CMP Implementation Files
- `src/browser/services/cmp.service.ts`: Core CMP service for GDPR compliance
- `src/browser/controllers/cmp.controller.ts`: IPC controller for CMP operations
- `scripts/installer.nsh`: NSIS installer with CMP Layer 1 implementation
- Registry: `HKCU\Software\aimii\GDPRRegion`: EU user detection flag

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