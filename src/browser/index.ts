import 'reflect-metadata';
import {app as ElectronApp } from 'electron';
import { Application } from "./application";
import { OverlayHotkeysService } from './services/overlay-hotkeys.service';
import { OverlayService } from './services/overlay.service';
import { GameEventsService } from './services/gep.service';
import { MainWindowController } from './controllers/main-window.controller';
import { DemoOSRWindowController } from './controllers/demo-osr-window.controller';
import { WidgetWindowController } from './controllers/widget-window.controller';
import { OverlayInputService } from './services/overlay-input.service';
import { SettingsService } from './services/settings.service';
import { BrowserWindow } from 'electron';

// Simple global console override - just like a normal website
let mainWindow: BrowserWindow | null = null;
let earlyLogs: Array<{ args: any[], timestamp: number }> = [];

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
  const overlayHotkeysService = new OverlayHotkeysService(overlayService);
  const gepService = new GameEventsService();
  const inputService = new OverlayInputService(overlayService);
  const settingsService = new SettingsService();

  const createDemoOsrWindowControllerFactory = (): DemoOSRWindowController => {
    const controller = new DemoOSRWindowController(overlayService);
    return controller;
  }

  const createWidgetWindowControllerFactory = (): WidgetWindowController => {
    const controller = new WidgetWindowController(overlayService, settingsService);
    return controller;
  }

  const mainWindowController = new MainWindowController(
    gepService,
    overlayService,
    createDemoOsrWindowControllerFactory,
    createWidgetWindowControllerFactory,
    overlayHotkeysService,
    inputService
  );

  return new Application(overlayService, gepService, mainWindowController);
}

const app = bootstrap();

ElectronApp.whenReady().then(() => {
  app.run();
});

ElectronApp.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    ElectronApp.quit();
  }
});
