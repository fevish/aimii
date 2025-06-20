import { BrowserWindow, app as electronApp } from 'electron';
import * as fs from 'fs';
import * as path from 'path';

interface WindowState {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
  isMinimized: boolean;
  devToolsOpen: boolean;
}

export class WindowStateService {
  private stateFilePath: string;
  private defaultState: WindowState = {
    x: 100,
    y: 100,
    width: 900,
    height: 500,
    isMaximized: false,
    isMinimized: false,
    devToolsOpen: false
  };

  constructor() {
    const userDataPath = electronApp.getPath('userData');
    this.stateFilePath = path.join(userDataPath, 'window-state.json');
  }

  /**
   * Save the current window state to file
   */
  public saveWindowState(window: BrowserWindow): void {
    try {
      const bounds = window.getBounds();
      const isMaximized = window.isMaximized();
      const isMinimized = window.isMinimized();
      const devToolsOpen = window.webContents.isDevToolsOpened();

      const state: WindowState = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        isMaximized,
        isMinimized,
        devToolsOpen
      };

      fs.writeFileSync(this.stateFilePath, JSON.stringify(state, null, 2));
    } catch (error) {
      console.log('Failed to save window state:', error);
    }
  }

  /**
   * Load the saved window state from file
   */
  public loadWindowState(): WindowState {
    try {
      if (fs.existsSync(this.stateFilePath)) {
        const data = fs.readFileSync(this.stateFilePath, 'utf8');
        const savedState = JSON.parse(data) as WindowState;

        // Validate the saved state
        if (this.isValidState(savedState)) {
          return savedState;
        }
      }
    } catch (error) {
      console.log('Failed to load window state:', error);
    }

    return { ...this.defaultState };
  }

  /**
   * Apply the saved state to a window
   */
  public applyWindowState(window: BrowserWindow): void {
    const state = this.loadWindowState();

    // Set window bounds
    if (!state.isMaximized && !state.isMinimized) {
      window.setBounds({
        x: state.x,
        y: state.y,
        width: state.width,
        height: state.height
      });
    }

    // Restore window state
    if (state.isMaximized) {
      window.maximize();
    } else if (state.isMinimized) {
      window.minimize();
    }

    // Restore dev tools state
    if (state.devToolsOpen) {
      // Small delay to ensure window is ready
      setTimeout(() => {
        if (!window.webContents.isDevToolsOpened()) {
          window.webContents.openDevTools();
        }
      }, 500);
    }
  }

  /**
   * Set up automatic state saving for a window
   */
  public setupStateSaving(window: BrowserWindow): void {
    // Save state when window is moved or resized
    window.on('moved', () => this.saveWindowState(window));
    window.on('resized', () => this.saveWindowState(window));

    // Save state when window state changes
    window.on('maximize', () => this.saveWindowState(window));
    window.on('unmaximize', () => this.saveWindowState(window));
    window.on('minimize', () => this.saveWindowState(window));
    window.on('restore', () => this.saveWindowState(window));

    // Save state when dev tools are opened/closed
    window.webContents.on('devtools-opened', () => this.saveWindowState(window));
    window.webContents.on('devtools-closed', () => this.saveWindowState(window));

    // Save state when window is about to close
    window.on('close', () => this.saveWindowState(window));
  }

  /**
   * Validate that a state object has all required properties
   */
  private isValidState(state: any): state is WindowState {
    return (
      typeof state === 'object' &&
      typeof state.x === 'number' &&
      typeof state.y === 'number' &&
      typeof state.width === 'number' &&
      typeof state.height === 'number' &&
      typeof state.isMaximized === 'boolean' &&
      typeof state.isMinimized === 'boolean' &&
      typeof state.devToolsOpen === 'boolean'
    );
  }
}