import 'reflect-metadata';
import {app as ElectronApp } from 'electron';
import { Application } from "./application";
import { OverlayService } from './services/overlay.service';
import { GameEventsService } from './services/gep.service';
import { MainWindowController } from './controllers/main-window.controller';

import { WidgetWindowController } from './controllers/widget-window.controller';

import { SettingsService } from './services/settings.service';
import { GamesService } from './services/games.service';
import { CurrentGameService } from './services/current-game.service';
import { SensitivityConverterService } from './services/sensitivity-converter.service';
import { BrowserWindow } from 'electron';
import { WindowStateService } from './services/window-state.service';
import { HotkeyService } from './services/hotkey.service';
import { CustomGameDetectorService } from './services/custom-game-detector.service';

// Simple global console override - just like a normal website
let mainWindow: BrowserWindow | null = null;
let mainWindowController: MainWindowController | null = null;
let earlyLogs: Array<{ args: any[], timestamp: number }> = [];

// Extend global type for cleanup
declare global {
  var mainWindowController: MainWindowController | null;
}

// Global reference for cleanup
let customGameDetectorService: CustomGameDetectorService | null = null;

const safeStringify = (obj: any): string => {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  if (typeof obj === 'function') return `[Function: ${obj.name || 'anonymous'}]`;

  try {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return `[Circular Reference]`;
        }
        seen.add(value);
      }
      return value;
    }, 2);
  } catch (error) {
    return `[Object: ${obj.constructor?.name || 'Unknown'}]`;
  }
};

const sendToChrome = (args: any[]) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const serializedArgs = args.map(arg => safeStringify(arg));
    mainWindow.webContents.executeJavaScript(`
      console.log(${serializedArgs.map(arg => `'${String(arg).replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`).join(', ')});
    `).catch(() => {});
  }
};

const originalConsole = console.log;
console.log = (...args: any[]) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    sendToChrome(args);
  } else {
    earlyLogs.push({ args, timestamp: Date.now() });
  }
};

export const setMainWindowForConsole = (window: BrowserWindow) => {
  mainWindow = window;

  // Replay all queued early logs to Chrome dev tools
  earlyLogs.forEach(({ args }) => {
    sendToChrome(args);
  });
  earlyLogs = [];
};

/**
 * TODO: Integrate your own dependency-injection library
 */
const bootstrap = (): Application => {
  const overlayService = new OverlayService();
  const gepService = new GameEventsService();

  const settingsService = new SettingsService();
  const gamesService = new GamesService();
  const currentGameService = new CurrentGameService(overlayService, gamesService);

  // Inject GEP service into current game service for fallback detection
  currentGameService.setGepService(gepService);

  const sensitivityConverterService = new SensitivityConverterService(gamesService, settingsService, currentGameService);
  const windowStateService = new WindowStateService();
  const hotkeyService = new HotkeyService(settingsService);
  customGameDetectorService = new CustomGameDetectorService(gamesService);



  const createWidgetWindowControllerFactory = (): WidgetWindowController => {
    const controller = new WidgetWindowController(overlayService, settingsService, currentGameService, hotkeyService);
    return controller;
  }

  const mainWindowController = new MainWindowController(
    gepService,
    overlayService,
    createWidgetWindowControllerFactory,
    gamesService,
    settingsService,
    currentGameService,
    sensitivityConverterService,
    windowStateService,
    hotkeyService
  );

  // Inject custom game detector into current game service
  currentGameService.setCustomGameDetectorService(customGameDetectorService);

  // Start custom game detector monitoring
  customGameDetectorService.startMonitoring();

  // Store reference for cleanup
  global.mainWindowController = mainWindowController;

  return new Application(overlayService, gepService, mainWindowController, gamesService);
}

const app = bootstrap();

ElectronApp.whenReady().then(() => {
  app.run();
});

ElectronApp.on('window-all-closed', () => {
  // Don't quit the app when all windows are closed
  // The app will continue running in the background with tray icon
  // Users can quit via the tray menu
});

ElectronApp.on('before-quit', () => {
  // Cleanup tray icon
  if (global.mainWindowController) {
    global.mainWindowController.destroy();
  }

  // Stop custom game detector
  if (customGameDetectorService) {
    customGameDetectorService.stopMonitoring();
  }
});
