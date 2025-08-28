# Requirements Document

## Introduction

This document outlines the requirements for implementing ad detection functionality in the aimii sensitivity converter app. The feature will detect when Overwolf ads are currently running and provide visual feedback by applying CSS classes to UI elements, specifically the terminal-container. This will allow for better user experience by adjusting the interface when ads are active.

The implementation will leverage Overwolf's ad events and provide a clean, service-based architecture for ad state management that can be extended for future ad-related features.

## Requirements

### Requirement 1: Ad State Detection

**User Story:** As a developer, I want to detect when ads are currently running so that I can adjust the UI accordingly.

#### Acceptance Criteria

1. WHEN an ad starts playing THEN the system SHALL detect the ad state change and update the application state
2. WHEN an ad finishes playing THEN the system SHALL detect the state change and update the application state
3. WHEN the application starts THEN the system SHALL check the current ad state and initialize accordingly
4. WHEN ad detection fails THEN the system SHALL handle the error gracefully and assume no ad is running
5. WHEN multiple ad units are present THEN the system SHALL track the state of each ad unit independently

### Requirement 2: CSS Class Management

**User Story:** As a user, I want the terminal-container to have visual indicators when ads are running so that I understand the current state of the interface.

#### Acceptance Criteria

1. WHEN an ad is currently running THEN the terminal-container SHALL have the CSS class "ad-running" applied
2. WHEN no ads are running THEN the terminal-container SHALL NOT have the "ad-running" CSS class
3. WHEN multiple ads are running THEN the terminal-container SHALL have the "ad-running" class applied
4. WHEN ad state changes THEN the CSS class SHALL be updated immediately without page refresh
5. WHEN the component unmounts THEN any event listeners SHALL be properly cleaned up

### Requirement 3: Service Architecture Integration

**User Story:** As a developer, I want ad detection to follow the established service architecture so that it's maintainable and testable.

#### Acceptance Criteria

1. WHEN implementing ad detection THEN the system SHALL create an AdService that handles all ad-related operations
2. WHEN components need ad state THEN they SHALL access it through a dedicated AdContext provider
3. WHEN ad events occur THEN the service SHALL emit events that components can subscribe to
4. WHEN testing ad functionality THEN the service SHALL be mockable and testable in isolation
5. WHEN extending ad features THEN the architecture SHALL support additional ad-related functionality

### Requirement 4: Overwolf Integration

**User Story:** As a developer, I want to properly integrate with Overwolf's ad system so that ad detection is reliable and follows platform best practices.

#### Acceptance Criteria

1. WHEN detecting ad state THEN the system SHALL use Overwolf's official ad events and APIs
2. WHEN handling ad events THEN the system SHALL properly register and unregister event listeners
3. WHEN ads are muted/unmuted THEN the system SHALL detect these state changes if relevant
4. WHEN house ads are displayed THEN the system SHALL handle house-ad-action events appropriately
5. WHEN the Overwolf platform is not available THEN the system SHALL gracefully degrade functionality

### Requirement 5: Performance and Reliability

**User Story:** As a user, I want ad detection to be performant and not impact the application's responsiveness.

#### Acceptance Criteria

1. WHEN monitoring ad state THEN the system SHALL use efficient event-based detection rather than polling
2. WHEN ad events fire frequently THEN the system SHALL debounce state updates to prevent excessive re-renders
3. WHEN ad detection encounters errors THEN the system SHALL retry with exponential backoff
4. WHEN the application is idle THEN ad detection SHALL continue to work without impacting performance
5. WHEN memory usage is a concern THEN the service SHALL properly clean up resources and prevent memory leaks

### Requirement 6: Error Handling and Fallbacks

**User Story:** As a user, I want the application to continue working normally even if ad detection fails.

#### Acceptance Criteria

1. WHEN ad detection APIs are unavailable THEN the system SHALL assume no ads are running and continue normal operation
2. WHEN ad event registration fails THEN the system SHALL log the error and provide fallback behavior
3. WHEN unexpected ad events occur THEN the system SHALL handle them gracefully without crashing
4. WHEN network connectivity affects ad loading THEN the detection system SHALL adapt accordingly
5. WHEN debugging ad issues THEN the system SHALL provide clear logging and error messages

### Requirement 7: Extensibility for Future Features

**User Story:** As a developer, I want the ad detection system to be extensible so that future ad-related features can be easily added.

#### Acceptance Criteria

1. WHEN adding new ad-related features THEN the existing AdService SHALL support extension without breaking changes
2. WHEN different components need ad state THEN the AdContext SHALL provide flexible access patterns
3. WHEN new ad events are added by Overwolf THEN the system SHALL be easily updatable to support them
4. WHEN custom ad behaviors are needed THEN the architecture SHALL support plugin-like extensions
5. WHEN ad analytics are required THEN the service SHALL provide hooks for tracking ad interactions

### Requirement 8: Development and Testing Support

**User Story:** As a developer, I want to be able to test ad functionality during development without requiring live ads.

#### Acceptance Criteria

1. WHEN developing locally THEN the system SHALL provide mock ad states for testing
2. WHEN running tests THEN the AdService SHALL be mockable with predictable behavior
3. WHEN debugging ad issues THEN the system SHALL provide detailed logging and state inspection
4. WHEN using the --test-ad flag THEN the system SHALL work with Overwolf's test ad functionality
5. WHEN simulating ad scenarios THEN developers SHALL be able to trigger different ad states manually