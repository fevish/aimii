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
  private isCheckingForGames: boolean = false; // Prevent multiple concurrent checks
  private lastGameCheckTime: number = 0; // Track last check time

  constructor() {
    super();
    this.registerOverwolfPackageManager();
  }


  /**
   *  for gep supported games goto:
   *  https://overwolf.github.io/api/electron/game-events/
   *   */
  public async registerGames(gepGamesId: number[]) {
    this.gepGamesId = gepGamesId;
    this.gepGamesSet = new Set(gepGamesId); // Create Set for O(1) lookups
    // console.log(`GEP: Registered ${gepGamesId.length} games: ${gepGamesId.join(', ')}`);

    // Check for already running games after registration
    if (this.gepApi) {
      await this.checkForAlreadyRunningGames();
    }
  }

  /**
   * Set required features for all supported games
   */
  public async setRequiredFeaturesForAllSupportedGames() {
    // Use Promise.all for parallel execution instead of sequential
    await Promise.all(this.gepGamesId.map(async gameId => {
      await this.gepApi.setRequiredFeatures(gameId, undefined);
    }));
  }

  /**
   * Check for already running games and detect them
   */
  public async checkForAlreadyRunningGames() {
    if (!this.gepApi) {
      // console.log('GEP API not ready yet, skipping initial game check');
      return;
    }

    // Debounce: Don't check more than once every 2 seconds
    const now = Date.now();
    if (this.isCheckingForGames || (now - this.lastGameCheckTime) < 2000) {
      // console.log('Game check skipped (too frequent or in progress)');
      return;
    }

    this.isCheckingForGames = true;
    this.lastGameCheckTime = now;

    const detectedGames: Array<{ gameId: number, name: string, gameInfo: any }> = [];

    // Check all supported games in parallel for better performance
    // console.log(`Checking ${this.gepGamesId.length} games in parallel...`);

    const gameCheckPromises = this.gepGamesId.map(async (gameId) => {
      try {
        const gameInfo = await this.gepApi.getInfo(gameId);

        if (gameInfo && gameInfo.gameInfo) {
          // console.log(`Found already running game: ${gameId} - ${gameInfo.gameInfo.name || 'Unknown'}`);

          // Add to active games set
          this.activeGames.add(gameId);

          // Set as active game if none is set (only for the first detected game)
          if (this.activeGame === 0) {
            this.activeGame = gameId;
          }

          // Set required features for the game
          await this.setRequiredFeaturesForGame(gameId);

          return {
            gameId,
            name: gameInfo.gameInfo.name || 'Unknown',
            gameInfo: gameInfo.gameInfo
          };
        }
      } catch (error) {
        // Game is not running, which is expected for most games
        // Don't log errors to reduce noise
      }
      return null;
    });

        // Wait for all checks to complete in parallel
    const gameCheckResults = await Promise.all(gameCheckPromises);

    // Filter out null results and collect detected games
    const validResults = gameCheckResults.filter((result): result is { gameId: number; name: string; gameInfo: any; } => result !== null);
    detectedGames.push(...validResults);

    // Emit all detected games in a single batch event
    if (detectedGames.length > 0) {
      // console.log(`Emitting batch startup detection for ${detectedGames.length} games`);

      // Emit individual events for each game (services still expect this)
      for (const { gameId, name, gameInfo } of detectedGames) {
        this.emit('game-detected', gameId, name, gameInfo);
      }
    }

    if (detectedGames.length > 0) {
      console.log(`Initial game check complete. Active games: ${Array.from(this.activeGames).join(', ')}`);
    }

    this.isCheckingForGames = false;
  }

  /**
   * Set required features for a specific game (for immediate setup)
   */
  private async setRequiredFeaturesForGame(gameId: number) {
    try {
      await this.gepApi.setRequiredFeatures(gameId, undefined);
      // console.log(`set-required-feature for: ${gameId} (immediate)`);
    } catch (error) {
      // console.log(`error setting features for ${gameId}:`, error);
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

    // Once a package is loaded
    app.overwolf.packages.on('ready', (e, packageName, version) => {

      // If this is the GEP package (packageName serves as a UID)
      if (packageName !== 'gep') {
        return;
      }

      // console.log(`GEP: gep package is ready: ${version}`);

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

    // Save package into private variable for later access
    this.gepApi = app.overwolf.packages.gep;

    // Remove all existing listeners to ensure a clean slate.
    // NOTE: If you have other classes listening on gep - they'll lose their
    // bindings.
    this.gepApi.removeAllListeners();

    // Note: Initial game check will happen after games are registered

    // If a game is detected by the package
    // To check if the game is running in elevated mode, use `gameInfo.isElevate`
    this.gepApi.on('game-detected', (e, gameId, name, gameInfo) => {
      // If the game isn't in our tracking list
      if (!this.gepGamesSet.has(gameId)) {
        // Stops the GEP Package from connecting to the game
        // console.log('gep: skip game-detected', gameId, name, gameInfo.pid);
        return;
      }

      // / if (gameInfo.isElevated) {
      //   // Show message to User?
      //   return;
      // }

      // console.log('GEP: Game Detected:', name);

      // Add to active games set
      this.activeGames.add(gameId);

      // Only set as active game if no active game is currently set
      if (this.activeGame === 0) {
        // console.log('gep: setting active game (no previous active game)', gameId);
        this.activeGame = gameId;
      } else {
        // console.log('gep: game detected but keeping current active game', this.activeGame, 'new game:', gameId);
      }

      this.emit('game-detected', gameId, name, gameInfo);
      e.enable();

      // Automatically set required features for immediate event detection
      this.setRequiredFeaturesForGame(gameId);
    });

    // Handle game exit for faster cleanup and detection

    this.gepApi.on('game-exit', (e, gameId, processName, pid, gameName) => {
      // console.log('GEP: Game Exited:', gameName);

      // Remove from active games set
      this.activeGames.delete(gameId);

      // Clear active game if this was the active one
      if (this.activeGame === gameId) {
        // console.log('gep: clearing active game due to exit', gameId);
        this.activeGame = 0;
        this.emit('game-exit', gameId, processName, pid);
      } else {
        // console.log('gep: game exit for non-active game', gameId, 'active:', this.activeGame);
      }
    });

    // If a game is detected running in elevated mode
    // **Note** - This fires AFTER `game-detected`
    this.gepApi.on('elevated-privileges-required', (e, gameId, ...args) => {
      // console.log('elevated-privileges-required', gameId, ...args);

      // Remove from active games set
      this.activeGames.delete(gameId);

      // Clear active game if elevated privileges are required but not available
      if (this.activeGame === gameId) {
        // console.log('gep: clearing active game due to elevated privileges', gameId);
        this.activeGame = 0;
      }

      // TODO Handle case of Game running in elevated mode (meaning that the app also needs to run in elevated mode in order to detect events)
    });

    // When a new Info Update is fired
    // this.gepApi.on('new-info-update', (e, gameId, ...args) => {
    //   console.log('info-update', gameId, ...args);
    // });

    // // When a new Game Event is fired
    // this.gepApi.on('new-game-event', (e, gameId, ...args) => {
    //   console.log('new-event', gameId, ...args);
    // });

    // If GEP encounters an error
    this.gepApi.on('error', (e, gameId, error, ...args) => {
      // console.log('gep-error', gameId, error, ...args);

      // Remove from active games set
      this.activeGames.delete(gameId);

      // Clear active game on error
      if (this.activeGame === gameId) {
        // console.log('gep: clearing active game due to error', gameId);
        this.activeGame = 0;
      }
    });
  }
}
