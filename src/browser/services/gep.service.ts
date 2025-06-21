import { app as electronApp } from 'electron';
import { overwolf } from '@overwolf/ow-electron' // TODO: wil be @overwolf/ow-electron
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
  private gepGamesId: number[] = [];
  private gepGamesSet: Set<number> = new Set(); // For O(1) lookups

  constructor() {
    super();
    this.registerOverwolfPackageManager();
  }


  /**
   *  for gep supported games goto:
   *  https://overwolf.github.io/api/electron/game-events/
   *   */
  public registerGames(gepGamesId: number[]) {
    this.emit('log', `register to game events for `, gepGamesId);
    this.gepGamesId = gepGamesId;
    this.gepGamesSet = new Set(gepGamesId); // Create Set for O(1) lookups
  }

  /**
   * Set required features for all supported games
   */
  public async setRequiredFeaturesForAllSupportedGames() {
    // Use Promise.all for parallel execution instead of sequential
    await Promise.all(this.gepGamesId.map(async (gameId) => {
      this.emit('log', `set-required-feature for: ${gameId}`);
      await this.gepApi.setRequiredFeatures(gameId, undefined);
    }));
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
    if (this.activeGame == 0) {
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

      this.emit('log', `gep package is ready: ${version}`);

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

    // If a game is detected by the package
    // To check if the game is running in elevated mode, use `gameInfo.isElevate`
    this.gepApi.on('game-detected', (e, gameId, name, gameInfo) => {
      // If the game isn't in our tracking list
      if (!this.gepGamesSet.has(gameId)) {
        // Stops the GEP Package from connecting to the game
        this.emit('log', 'gep: skip game-detected', gameId, name, gameInfo.pid);
        return;
      }

      /// if (gameInfo.isElevated) {
      //   // Show message to User?
      //   return;
      // }

      this.emit('log', 'gep: register game-detected', gameId, name, gameInfo);
      this.activeGame = gameId; // Set active game first
      this.emit('game-detected', gameId, name, gameInfo); // Then emit event
      e.enable();

      // Automatically set required features for immediate event detection
      this.setRequiredFeaturesForGame(gameId);
    });

    // Handle game exit for faster cleanup and detection
    //@ts-ignore
    this.gepApi.on('game-exit', (e, gameId, processName, pid) => {
      this.emit('log', 'gep: game-exit', gameId, processName, pid);

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
      this.emit('log',
        'elevated-privileges-required',
        gameId,
        ...args
      );

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

      // Clear active game on error
      if (this.activeGame === gameId) {
        this.emit('log', 'gep: clearing active game due to error', gameId);
        this.activeGame = 0;
      }
    });
  }
}
