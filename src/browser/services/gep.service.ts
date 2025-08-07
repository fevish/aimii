import { app as electronApp } from 'electron';
import { overwolf } from '@overwolf/ow-electron'; // TODO: wil be @overwolf/ow-electron
import EventEmitter from 'events';

const app = electronApp as overwolf.OverwolfApp;

/**
 * Service used to register for Game Events,
 * receive games events, and then send them to a window for visual feedback
 *
 */
export class GameEventsService extends EventEmitter {
  private gepApi!: overwolf.packages.OverwolfGameEventPackage;
  public activeGame = 0;
  public activeGames: Set<number> = new Set(); // Track all active games
  private gepGamesId: number[] = [];
  private gepGamesSet: Set<number> = new Set(); // For O(1) lookups

  constructor() {
    super();
    this.emit('log', 'GEP: GameEventsService constructor called');
    this.registerOverwolfPackageManager();
  }


  /**
   *  for gep supported games goto:
   *  https://overwolf.github.io/api/electron/game-events/
   *   */
  public async registerGames(gepGamesId: number[]) {
    this.emit('log', 'GEP: register to game events for ', gepGamesId);
    this.gepGamesId = gepGamesId;
    this.gepGamesSet = new Set(gepGamesId); // Create Set for O(1) lookups
    this.emit('log', `GEP: Registered ${gepGamesId.length} games: ${gepGamesId.join(', ')}`);

    // Check for already running games after registration
    if (this.gepApi) {
      this.emit('log', 'GEP: Checking for already running games after registration...');
      await this.checkForAlreadyRunningGames();
    }
  }

  /**
   * Set required features for all supported games
   */
  public async setRequiredFeaturesForAllSupportedGames() {
    // Use Promise.all for parallel execution instead of sequential
    await Promise.all(this.gepGamesId.map(async gameId => {
      this.emit('log', `set-required-feature for: ${gameId}`);
      await this.gepApi.setRequiredFeatures(gameId, undefined);
    }));
  }

  /**
   * Check for already running games and detect them
   */
  public async checkForAlreadyRunningGames() {
    if (!this.gepApi) {
      this.emit('log', 'GEP API not ready yet, skipping initial game check');
      return;
    }

    this.emit('log', 'Checking for already running games...');
    this.emit('log', `Supported games to check: ${this.gepGamesId.join(', ')}`);

    // Check each supported game to see if it's already running
    for (const gameId of this.gepGamesId) {
      this.emit('log', `Checking game ID: ${gameId}...`);

      try {
        // Try to get info for the game - if it succeeds, the game is running
        const gameInfo = await this.gepApi.getInfo(gameId);

        this.emit('log', `Game ${gameId} getInfo result:`, gameInfo);

        if (gameInfo && gameInfo.gameInfo) {
          this.emit('log', `Found already running game: ${gameId} - ${gameInfo.gameInfo.name || 'Unknown'}`);

          // Add to active games set
          this.activeGames.add(gameId);

          // Set as active game if none is set
          if (this.activeGame === 0) {
            this.activeGame = gameId;
          }

          // Emit game-detected event to notify other services
          this.emit('game-detected', gameId, gameInfo.gameInfo.name || 'Unknown', gameInfo.gameInfo);

          // Set required features for the game
          await this.setRequiredFeaturesForGame(gameId);
        } else {
          this.emit('log', `Game ${gameId} is not running (no gameInfo)`);
        }
      } catch (error) {
        // Game is not running, which is expected for most games
        this.emit('log', `Game ${gameId} is not running (error):`, error);
      }
    }

    this.emit('log', `Initial game check complete. Active games: ${Array.from(this.activeGames).join(', ')}`);
  }

  /**
   * Set required features for a specific game (for immediate setup)
   */
  private async setRequiredFeaturesForGame(gameId: number) {
    try {
      await this.gepApi.setRequiredFeatures(gameId, undefined);
      this.emit('log', `set-required-feature for: ${gameId} (immediate)`);
    } catch (error) {
      this.emit('log', `error setting features for ${gameId}:`, error);
    }
  }

  /**
   *
   */
  public async getInfoForActiveGame(): Promise<any> {
    if (this.activeGame === 0) {
      return 'getInfo error - no active game';
    }

    return await this.gepApi.getInfo(this.activeGame);
  }

  /**
   * Register the Overwolf Package Manager events
   */
  private registerOverwolfPackageManager() {
    this.emit('log', 'GEP: Setting up package manager listener...');

    // Once a package is loaded
    app.overwolf.packages.on('ready', (e, packageName, version) => {
      this.emit('log', `GEP: Package ready event received: ${packageName} v${version}`);

      // If this is the GEP package (packageName serves as a UID)
      if (packageName !== 'gep') {
        this.emit('log', `GEP: Ignoring non-GEP package: ${packageName}`);
        return;
      }

      this.emit('log', `GEP: gep package is ready: ${version}`);

      // Prepare for Game Event handling
      this.onGameEventsPackageReady();

      this.emit('ready');
    });
  }

  /**
   * Register listeners for the GEP Package once it is ready
   *
   * @param {overwolf.packages.OverwolfGameEventPackage} gep The GEP Package instance
   */
  private async onGameEventsPackageReady() {
    this.emit('log', 'GEP: onGameEventsPackageReady called');

    // Save package into private variable for later access
    this.gepApi = app.overwolf.packages.gep;
    this.emit('log', 'GEP: GEP API saved');

    // Remove all existing listeners to ensure a clean slate.
    // NOTE: If you have other classes listening on gep - they'll lose their
    // bindings.
    this.gepApi.removeAllListeners();
    this.emit('log', 'GEP: Removed all existing listeners');

    // Note: Initial game check will happen after games are registered
    this.emit('log', 'GEP: Ready for game registration');

    // If a game is detected by the package
    // To check if the game is running in elevated mode, use `gameInfo.isElevate`
    this.gepApi.on('game-detected', (e, gameId, name, gameInfo) => {
      // If the game isn't in our tracking list
      if (!this.gepGamesSet.has(gameId)) {
        // Stops the GEP Package from connecting to the game
        this.emit('log', 'gep: skip game-detected', gameId, name, gameInfo.pid);
        return;
      }

      // / if (gameInfo.isElevated) {
      //   // Show message to User?
      //   return;
      // }

      this.emit('log', 'gep: register game-detected', gameId, name, gameInfo);
      this.activeGame = gameId; // Set active game first (for backward compatibility)
      this.activeGames.add(gameId); // Add to active games set
      this.emit('game-detected', gameId, name, gameInfo); // Then emit event
      e.enable();

      // Automatically set required features for immediate event detection
      this.setRequiredFeaturesForGame(gameId);
    });

    // Handle game exit for faster cleanup and detection

    this.gepApi.on('game-exit', (e, gameId, processName, pid) => {
      this.emit('log', 'gep: game-exit', gameId, processName, pid);

      // Remove from active games set
      this.activeGames.delete(gameId);

      // Clear active game if this was the active one
      if (this.activeGame === gameId) {
        this.emit('log', 'gep: clearing active game due to exit', gameId);
        this.activeGame = 0;
        this.emit('game-exit', gameId, processName, pid);
      } else {
        this.emit('log', 'gep: game exit for non-active game', gameId, 'active:', this.activeGame);
      }
    });

    // If a game is detected running in elevated mode
    // **Note** - This fires AFTER `game-detected`
    this.gepApi.on('elevated-privileges-required', (e, gameId, ...args) => {
      this.emit(
        'log',
        'elevated-privileges-required',
        gameId,
        ...args
      );

      // Remove from active games set
      this.activeGames.delete(gameId);

      // Clear active game if elevated privileges are required but not available
      if (this.activeGame === gameId) {
        this.emit('log', 'gep: clearing active game due to elevated privileges', gameId);
        this.activeGame = 0;
      }

      // TODO Handle case of Game running in elevated mode (meaning that the app also needs to run in elevated mode in order to detect events)
    });

    // When a new Info Update is fired
    this.gepApi.on('new-info-update', (e, gameId, ...args) => {
      this.emit('log', 'info-update', gameId, ...args);
    });

    // When a new Game Event is fired
    this.gepApi.on('new-game-event', (e, gameId, ...args) => {
      this.emit('log', 'new-event', gameId, ...args);
    });

    // If GEP encounters an error
    this.gepApi.on('error', (e, gameId, error, ...args) => {
      this.emit('log', 'gep-error', gameId, error, ...args);

      // Remove from active games set
      this.activeGames.delete(gameId);

      // Clear active game on error
      if (this.activeGame === gameId) {
        this.emit('log', 'gep: clearing active game due to error', gameId);
        this.activeGame = 0;
      }
    });
  }
}
