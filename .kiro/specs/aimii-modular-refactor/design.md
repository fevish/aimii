# Design Document

## Overview

This design document outlines the architectural refactoring of the aimii sensitivity converter app to achieve better modularity, maintainability, and code organization. The refactoring will transform the current tightly-coupled architecture into a clean, modular system while preserving all existing functionality.

The key principle is to create reusable, focused components and services that follow consistent patterns, eliminate code duplication, and provide clear separation of concerns.

## Architecture

### Current Architecture Issues

The current architecture has several problems:
- **Component Duplication**: Similar UI patterns are implemented multiple times (settings flows, game displays, sensitivity calculations)
- **Tight Coupling**: Components directly manage complex state and business logic
- **Inconsistent Patterns**: Different approaches for similar functionality across components
- **Service Fragmentation**: Business logic scattered across components and services
- **State Management Complexity**: Prop drilling and inconsistent state updates

### Target Architecture

The new architecture will follow these principles:

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
├─────────────────────────────────────────────────────────────┤
│  Main Window  │  Widget  │  Settings  │  Onboarding        │
│               │          │            │                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │           Shared UI Components                          │ │
│  │  • SensitivityDisplay                                   │ │
│  │  • GameSelector                                         │ │
│  │  • SettingsFlow                                         │ │
│  │  • UserPreferences                                      │ │
│  └─────────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│                     Context Layer                           │
├─────────────────────────────────────────────────────────────┤
│  • AppContext (global state)                               │
│  • GameContext (game detection & current game)             │
│  • SettingsContext (user preferences)                      │
│  • SensitivityContext (calculations & conversions)         │
├─────────────────────────────────────────────────────────────┤
│                     Service Layer                           │
├─────────────────────────────────────────────────────────────┤
│  • GameService (unified game operations)                   │
│  • SensitivityService (all calculations)                   │
│  • SettingsService (user preferences)                      │
│  • GameDetectionService (GEP + custom detection)           │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                              │
├─────────────────────────────────────────────────────────────┤
│  • IPC Handlers                                            │
│  • File System                                             │
│  • Game Data                                               │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### Core Shared Components

#### 1. SensitivityDisplay Component
**Purpose**: Unified component for displaying sensitivity information across all contexts.

```typescript
interface SensitivityDisplayProps {
  sensitivity: number | null;
  gameData?: GameData;
  showDetails?: boolean;
  format?: 'compact' | 'detailed';
  showConversions?: boolean;
}
```

**Usage**: Main window game info, widget display, calculator results.

#### 2. GameSelector Component
**Purpose**: Reusable game selection with search and filtering.

```typescript
interface GameSelectorProps {
  games: GameData[];
  selectedGame?: string;
  onGameSelect: (game: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showOnlyEnabled?: boolean;
}
```

**Usage**: Onboarding, preferences, calculator.

#### 3. SettingsFlow Component
**Purpose**: Unified multi-step settings configuration.

```typescript
interface SettingsFlowProps {
  context: 'onboarding' | 'preferences';
  initialData?: Partial<SettingsData>;
  onComplete: (data: SettingsData) => void;
  onCancel?: () => void;
  steps?: SettingsStep[];
}
```

**Usage**: Onboarding process, user preferences modification.

#### 4. UserPreferences Component
**Purpose**: Display and manage user baseline settings.

```typescript
interface UserPreferencesProps {
  settings: BaselineSettings | null;
  onEdit: () => void;
  onReset: () => void;
  showActions?: boolean;
}
```

**Usage**: Main window preferences card, settings page.

#### 5. SensitivityCalculator Component
**Purpose**: Manual sensitivity conversion calculator.

```typescript
interface SensitivityCalculatorProps {
  onCalculate: (result: CalculationResult) => void;
  initialState?: CalculatorState;
  mode?: 'modal' | 'inline';
}
```

**Usage**: Calculator modal, potential future inline calculator.

### Context Providers

#### 1. AppContext
**Purpose**: Global application state and configuration.

```typescript
interface AppContextValue {
  isLoading: boolean;
  error: string | null;
  theme: string;
  version: string;
  setError: (error: string | null) => void;
  setTheme: (theme: string) => void;
}
```

#### 2. GameContext
**Purpose**: Game detection and current game state.

```typescript
interface GameContextValue {
  currentGame: CurrentGameInfo | null;
  allDetectedGames: CurrentGameInfo[];
  availableGames: GameData[];
  isDetecting: boolean;
  setCurrentGame: (gameId: string) => void;
  refreshDetection: () => Promise<void>;
}
```

#### 3. SettingsContext
**Purpose**: User settings and preferences.

```typescript
interface SettingsContextValue {
  baselineSettings: BaselineSettings | null;
  hasBaseline: boolean;
  isOnboardingRequired: boolean;
  updateBaseline: (settings: BaselineSettings) => Promise<void>;
  clearBaseline: () => Promise<void>;
  resetToDefaults: () => Promise<void>;
}
```

#### 4. SensitivityContext
**Purpose**: Sensitivity calculations and conversions.

```typescript
interface SensitivityContextValue {
  currentSuggestion: SensitivityConversion | null;
  allConversions: SensitivityConversion[];
  mouseTravel: number | null;
  trueSens: number | null;
  calculateForGame: (game: GameData, dpi: number) => number | null;
  calculateMouseTravel: (game: GameData, sens: number, dpi: number) => number | null;
}
```

### Service Layer Consolidation

#### 1. Unified GameService
**Purpose**: Consolidate all game-related operations.

```typescript
class GameService {
  // Game data operations
  getAllGames(): GameData[];
  getEnabledGames(): GameData[];
  getGameById(id: string): GameData | null;
  getGameByName(name: string): GameData | null;

  // Game calculations
  calculateTargetSensitivity(game: GameData, mouseTravel: number, dpi: number): number | null;
  calculateCm360(game: GameData, sensitivity: number, dpi: number): number | null;

  // Game validation
  isGameSupported(gameId: string): boolean;
  validateGameData(game: GameData): boolean;
}
```

#### 2. Enhanced SensitivityService
**Purpose**: All sensitivity calculation logic.

```typescript
class SensitivityService {
  // Core calculations
  convertBetweenGames(fromGame: GameData, toGame: GameData, sensitivity: number, dpi: number): number | null;
  calculateMouseTravelFromGame(game: GameData, sensitivity: number, dpi: number): number | null;
  calculateSensitivityFromMouseTravel(game: GameData, mouseTravel: number, dpi: number): number | null;

  // Utility calculations
  calculateTrueSens(mouseTravel: number): number;
  calculateEDPI(sensitivity: number, dpi: number): number;

  // Batch operations
  getAllConversionsFromBaseline(baseline: BaselineSettings): SensitivityConversion[];
  getSuggestedForCurrentGame(): SensitivityConversion | null;
}
```

#### 3. Consolidated GameDetectionService
**Purpose**: Unified game detection logic.

```typescript
class GameDetectionService {
  // Detection methods
  detectCurrentGames(): Promise<CurrentGameInfo[]>;
  detectViaGEP(): Promise<CurrentGameInfo[]>;
  detectViaCustom(): Promise<CurrentGameInfo[]>;

  // State management
  getCurrentGame(): CurrentGameInfo | null;
  setCurrentGame(gameId: string): void;

  // Event handling
  onGameChanged(callback: (game: CurrentGameInfo) => void): void;
  removeGameChangedListener(): void;
}
```

## Data Models

### Enhanced Type Definitions

```typescript
// Core data types
interface GameData {
  game: string;
  processName?: string;
  scalingFactor: number;
  owGameId: string;
  owConstant?: string;
  owGameName?: string;
  enable_for_app: boolean;
  specialConversion?: boolean;
  conversionParams?: ConversionParams;
}

interface BaselineSettings {
  mouseTravel: number;
  dpi: number;
  trueSens: number;
  favoriteGame: string;
  favoriteSensitivity: number;
  eDPI: number;
}

interface SensitivityConversion {
  gameName: string;
  suggestedSensitivity: number;
  mouseTravel: number;
  userDPI: number;
  trueSens: number;
  eDPI: number;
}

// UI state types
interface SettingsData {
  selectedGame: string;
  sensitivity: string;
  dpi: string;
  edpi: string;
}

interface CalculatorState {
  fromGame: GameData | null;
  toGame: GameData | null;
  fromSensitivity: string;
  fromDpi: string;
  convertedSensitivity: number;
  eDpi: number;
  inches360: number;
  cm360: number;
}

// Context state types
interface LoadingState {
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}
```

### State Management Patterns

#### 1. Context-Based State Management
- Use React Context for shared state instead of prop drilling
- Implement custom hooks for context consumption
- Provide loading and error states consistently

#### 2. Async State Handling
```typescript
interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  lastFetch: Date | null;
}

// Custom hook pattern
function useAsyncState<T>(
  fetchFn: () => Promise<T>,
  dependencies: any[] = []
): AsyncState<T> & {
  refetch: () => Promise<void>;
  reset: () => void;
}
```

#### 3. Form State Management
```typescript
interface FormState<T> {
  data: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isDirty: boolean;
}

// Reusable form hook
function useFormState<T>(
  initialData: T,
  validationRules: ValidationRules<T>
): FormState<T> & {
  updateField: (field: keyof T, value: any) => void;
  validate: () => boolean;
  reset: () => void;
}
```

## Error Handling

### Centralized Error Management

#### 1. Error Types
```typescript
enum ErrorType {
  VALIDATION = 'validation',
  NETWORK = 'network',
  CALCULATION = 'calculation',
  SYSTEM = 'system',
  USER_INPUT = 'user_input'
}

interface AppError {
  type: ErrorType;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}
```

#### 2. Error Boundary Component
```typescript
interface ErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  children: React.ReactNode;
}
```

#### 3. Error Context
```typescript
interface ErrorContextValue {
  errors: AppError[];
  addError: (error: AppError) => void;
  removeError: (id: string) => void;
  clearErrors: () => void;
  hasErrors: boolean;
}
```

### Service-Level Error Handling

#### 1. Service Error Patterns
```typescript
// Result pattern for service methods
type ServiceResult<T> = {
  success: true;
  data: T;
} | {
  success: false;
  error: AppError;
};

// Service base class with error handling
abstract class BaseService {
  protected handleError(error: any, context: string): AppError {
    // Standardized error processing
  }

  protected wrapAsync<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<ServiceResult<T>> {
    // Standardized async error wrapping
  }
}
```

#### 2. Validation Framework
```typescript
interface ValidationRule<T> {
  field: keyof T;
  validator: (value: any) => boolean;
  message: string;
}

class ValidationService {
  static validateSettings(data: SettingsData): ValidationResult {
    // Centralized validation logic
  }

  static validateGameData(game: GameData): ValidationResult {
    // Game data validation
  }
}
```

## Testing Strategy

### Component Testing Approach

#### 1. Component Test Structure
```typescript
// Test utilities
interface TestWrapperProps {
  initialState?: Partial<AppState>;
  mocks?: Partial<ServiceMocks>;
}

function createTestWrapper(props: TestWrapperProps): React.FC {
  // Provides all necessary context providers with test data
}

// Component test pattern
describe('SensitivityDisplay', () => {
  it('should display sensitivity correctly', () => {
    const wrapper = createTestWrapper({
      initialState: { sensitivity: 2.5 }
    });

    render(<SensitivityDisplay sensitivity={2.5} />, { wrapper });
    // Test assertions
  });
});
```

#### 2. Service Testing
```typescript
// Service mocking
interface ServiceMocks {
  gameService: Partial<GameService>;
  sensitivityService: Partial<SensitivityService>;
  settingsService: Partial<SettingsService>;
}

// Service test pattern
describe('SensitivityService', () => {
  let service: SensitivityService;
  let mockGameService: jest.Mocked<GameService>;

  beforeEach(() => {
    mockGameService = createMockGameService();
    service = new SensitivityService(mockGameService);
  });

  it('should calculate sensitivity correctly', () => {
    // Test implementation
  });
});
```

#### 3. Integration Testing
```typescript
// End-to-end component flow testing
describe('Settings Flow Integration', () => {
  it('should complete onboarding flow', async () => {
    const onComplete = jest.fn();
    const wrapper = createTestWrapper();

    render(
      <SettingsFlow context="onboarding" onComplete={onComplete} />,
      { wrapper }
    );

    // Simulate user interaction through all steps
    // Verify final state and callbacks
  });
});
```

### Testing Utilities

#### 1. Mock Data Factories
```typescript
class TestDataFactory {
  static createGameData(overrides?: Partial<GameData>): GameData {
    // Create test game data
  }

  static createBaselineSettings(overrides?: Partial<BaselineSettings>): BaselineSettings {
    // Create test baseline settings
  }

  static createSensitivityConversion(overrides?: Partial<SensitivityConversion>): SensitivityConversion {
    // Create test conversion data
  }
}
```

#### 2. Custom Test Hooks
```typescript
function renderHookWithContext<T>(
  hook: () => T,
  contextProps?: TestWrapperProps
): RenderHookResult<T, any> {
  const wrapper = createTestWrapper(contextProps);
  return renderHook(hook, { wrapper });
}
```

## Performance Optimization

### Rendering Optimization

#### 1. Memoization Strategy
```typescript
// Component memoization
const SensitivityDisplay = React.memo<SensitivityDisplayProps>(
  ({ sensitivity, gameData, showDetails }) => {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Custom comparison logic
  }
);

// Hook memoization
function useSensitivityCalculation(game: GameData, dpi: number) {
  return React.useMemo(() => {
    // Expensive calculation
  }, [game.game, game.scalingFactor, dpi]);
}
```

#### 2. State Update Optimization
```typescript
// Batched state updates
function useOptimizedState<T>(initialState: T) {
  const [state, setState] = React.useState(initialState);

  const batchedUpdate = React.useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  return [state, batchedUpdate] as const;
}
```

#### 3. Debounced Operations
```typescript
// Debounced search/filtering
function useDebounced<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
```

### Data Optimization

#### 1. Caching Strategy
```typescript
class CacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  get<T>(key: string): T | null {
    // Cache retrieval with TTL check
  }

  set<T>(key: string, data: T, ttl: number = 300000): void {
    // Cache storage with TTL
  }

  invalidate(pattern?: string): void {
    // Cache invalidation
  }
}
```

#### 2. Lazy Loading
```typescript
// Lazy component loading
const Calculator = React.lazy(() => import('./SensitivityCalculator'));

// Lazy data loading
function useLazyData<T>(fetchFn: () => Promise<T>, trigger: boolean) {
  const [data, setData] = React.useState<T | null>(null);

  React.useEffect(() => {
    if (trigger && !data) {
      fetchFn().then(setData);
    }
  }, [trigger, data, fetchFn]);

  return data;
}
```

## Migration Strategy

### Phase 1: Service Layer Refactoring
1. Create new consolidated service classes
2. Implement service interfaces with backward compatibility
3. Update IPC handlers to use new services
4. Test service functionality thoroughly

### Phase 2: Context Implementation
1. Create context providers for each domain
2. Implement custom hooks for context consumption
3. Gradually migrate components to use contexts
4. Remove prop drilling patterns

### Phase 3: Component Modularization
1. Extract shared components from existing implementations
2. Create reusable component library
3. Update existing components to use shared components
4. Remove duplicate component code

### Phase 4: State Management Migration
1. Replace direct state management with context-based patterns
2. Implement consistent async state handling
3. Add proper error boundaries and error handling
4. Optimize performance with memoization

### Phase 5: Testing and Cleanup
1. Add comprehensive test coverage
2. Remove deprecated code and unused imports
3. Optimize bundle size and performance
4. Document new architecture and patterns

### Backward Compatibility

#### 1. API Compatibility
- Maintain existing IPC interfaces during migration
- Use adapter patterns for service method compatibility
- Provide deprecation warnings for old patterns

#### 2. Data Migration
- Handle legacy settings format gracefully
- Provide automatic data structure upgrades
- Maintain user preference continuity

#### 3. Gradual Migration
- Implement feature flags for new components
- Allow rollback to previous implementations
- Test thoroughly at each migration phase