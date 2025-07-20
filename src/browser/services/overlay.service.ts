import { app as electronApp } from 'electron';
import { overwolf } from '@overwolf/ow-electron'; // TODO: wil be @overwolf/ow-electron
import {
  IOverwolfOverlayApi,
  OverlayWindowOptions,
  OverlayBrowserWindow,
  GamesFilter,
} from '@overwolf/ow-electron-packages-types';
import EventEmitter from 'events';

const app = electronApp as overwolf.OverwolfApp;

export class OverlayService extends EventEmitter {
  private isOverlayReady = false;

  public get overlayApi(): IOverwolfOverlayApi | null {
    // Do not let the application access the overlay before it is ready
    if (!this.isOverlayReady) {
      return null;
    }
    return (app.overwolf.packages as any).overlay as IOverwolfOverlayApi;
  }

  /**
   *
   */
  constructor() {
    super();
    this.startOverlayWhenPackageReady();
  }

  /**
   *
   */
  public async createNewOsrWindow(
    options: OverlayWindowOptions
  ): Promise<OverlayBrowserWindow> {
    if (!this.overlayApi) {
      throw new Error('Overlay API not ready');
    }
    const overlay = await this.overlayApi.createWindow(options);
    return overlay;
  }

  /**
   * Register games for overlay injection
   */
  public async registerToGames(gameIds: number[]): Promise<void> {
    // Removed 2-second delay - this was causing slow injection
    this.log('registering to game ids:', gameIds);

    const filter: GamesFilter = {
      gamesIds: gameIds,
    };

    if (!this.overlayApi) {
      throw new Error('Overlay API not ready');
    }
    await this.overlayApi.registerGames(filter);

    this.log('overlay is registered');
  }

  /**
   * Check for already running games and attempt injection
   */
  public async checkForAlreadyRunningGames(): Promise<void> {
    if (!this.overlayApi) {
      this.log('Overlay API not ready yet, skipping initial game check');
      return;
    }

    this.log('Checking for already running games via overlay...');

    try {
      // Get active game info from overlay
      const activeGame = this.overlayApi.getActiveGameInfo();

      if (activeGame && activeGame.gameInfo) {
        this.log('Found already running game via overlay:', activeGame.gameInfo.name);

        // Emit game-injected event to notify other services
        this.emit('game-injected', activeGame.gameInfo);
      } else {
        this.log('No active game found via overlay');
      }
    } catch (error) {
      this.log('Error checking for already running games via overlay:', error);
    }
  }

  //----------------------------------------------------------------------------
  private startOverlayWhenPackageReady() {
    app.overwolf.packages.on('ready', (e, packageName, version) => {
      if (packageName !== 'overlay') {
        return;
      }

      this.isOverlayReady = true;
      this.startOverlay(version);
    });
  }

  //----------------------------------------------------------------------------
  // must be called after package is 'ready' (i.e loaded)
  private async startOverlay(version: string) {
    if (!this.overlayApi) {
      throw new Error('Attempting to access overlay before available');
    }

    this.log(`overlay package is ready: ${version}`);

    this.registerOverlayEvents();

    // Check for already running games
    await this.checkForAlreadyRunningGames();

    this.emit('ready');
  }

  private registerOverlayEvents() {
    // prevent double events in case the package relaunch due crash
    // or update.
    //
    // NOTE: If you have another class listening on events, this will remove
    // their listeners as well.
    if (!this.overlayApi) return;

    this.overlayApi.removeAllListeners();

    this.log('registering to overlay package events');

    this.overlayApi.on('game-launched', (event, gameInfo) => {
      this.log('game launched', gameInfo);

      if (gameInfo.processInfo?.isElevated) {
        // ToDo: emit to log and notify user- we can't inject to elevated games
        // if the application is not eleveted.
        return;
      }

      // pass the decision to the application
      this.emit('injection-decision-handling', event, gameInfo);

      // or just call
      //event.inject();
    });

    this.overlayApi.on('game-injection-error', (gameInfo, error) => {
      this.log('game-injection-error', error, gameInfo);
    });

    this.overlayApi.on('game-injected', (gameInfo) => {
      this.log('new game injected!', gameInfo);
    });

    this.overlayApi.on('game-focus-changed', (window, game, focus) => {
      this.log('game window focus changes', game.name, focus);
    });

    this.overlayApi.on('game-window-changed', (window, game, reason) => {
      this.log('game window info changed', reason, window);
    });

    this.overlayApi.on('game-input-interception-changed', (info) => {
      this.log('overlay input interception changed', info);
    });

    this.overlayApi.on('game-input-exclusive-mode-changed', (info) => {
      this.log('overlay input exclusive mode changed', info);
    });

    // Add game exit event listener for better cleanup
    this.overlayApi.on('game-exit', (gameInfo) => {
      this.log('game exit detected', gameInfo);
      this.emit('game-exit', gameInfo);
    });
  }

  /** */
  private log(message: string, ...args: any[]) {
    try {
      this.emit('log', message, ...args);
    } catch {}
  }
}
