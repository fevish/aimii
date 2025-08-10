console.log(`aimii v${process.env.APP_VERSION} successfully loaded`);
const { contextBridge, ipcRenderer } = require('electron');

async function initialize () {
  function replaceText (selector: string, text: string) {
    const element = document.querySelector<HTMLElement>(selector);
    if (element) {
      element.innerText = text;
    }
  }

  replaceText('.electron-version', `ow-electron v${process.versions.electron}`);
}

contextBridge.exposeInMainWorld('app', {
  initialize
});

contextBridge.exposeInMainWorld('gep', {
  onMessage: (func: (...args: any[]) => void) => {
    ipcRenderer.on('console-message', (e: any, ...args: any[]) => {
      // Log to Chrome console instead of terminal
      console.log(...args);
      func(...args);
    });
  },

  setRequiredFeature: () => {
    return ipcRenderer.invoke('gep-set-required-feature');
  },

  getInfo: () => {
    return ipcRenderer.invoke('gep-getInfo');
  },

  restartInitialization: () => {
    return ipcRenderer.invoke('restart-initialization');
  },
});


contextBridge.exposeInMainWorld('electronAPI', {
  openWidgetDevTools: () => {
    return ipcRenderer.invoke('openWidgetDevTools');
  },
  openExternalUrl: (url: string) => {
    return ipcRenderer.invoke('open-external-url', url);
  }
});

contextBridge.exposeInMainWorld('games', {
  getAllGames: () => {
    return ipcRenderer.invoke('games-get-all');
  },
  getEnabledGames: () => {
    return ipcRenderer.invoke('games-get-enabled');
  },
  getGameSummary: () => {
    return ipcRenderer.invoke('games-get-summary');
  },
  getEnabledGameIds: () => {
    return ipcRenderer.invoke('games-get-enabled-ids');
  }
});

contextBridge.exposeInMainWorld('settings', {
  getBaselineSettings: () => {
    return ipcRenderer.invoke('settings-get-baseline');
  },
  setBaselineSettings: (mouseTravel: number, dpi: number, favoriteGame?: string, favoriteSensitivity?: number, eDPI?: number) => {
    return ipcRenderer.invoke('settings-set-baseline', mouseTravel, dpi, favoriteGame, favoriteSensitivity, eDPI);
  },
  hasBaselineSettings: () => {
    return ipcRenderer.invoke('settings-has-baseline');
  },
  clearBaselineSettings: () => {
    return ipcRenderer.invoke('settings-clear-baseline');
  },
  getTheme: () => {
    return ipcRenderer.invoke('settings-get-theme');
  },
  setTheme: (theme: string) => {
    return ipcRenderer.invoke('settings-set-theme', theme);
  },
  onThemeChanged: (callback: (theme: string) => void) => {
    ipcRenderer.on('theme-changed', (event: any, theme: string) => {
      callback(theme);
    });
  },
  removeThemeListener: () => {
    ipcRenderer.removeAllListeners('theme-changed');
  }
});

contextBridge.exposeInMainWorld('currentGame', {
  getCurrentGameInfo: () => {
    return ipcRenderer.invoke('current-game-get-info');
  },
  getAllDetectedGames: () => {
    return ipcRenderer.invoke('current-game-get-all-detected');
  },
  setCurrentGame: (gameId: number) => {
    return ipcRenderer.invoke('current-game-set-current', gameId);
  },
  isGameRunning: () => {
    return ipcRenderer.invoke('current-game-is-running');
  },
  getCurrentGameName: () => {
    return ipcRenderer.invoke('current-game-get-name');
  },
  isCurrentGameSupported: () => {
    return ipcRenderer.invoke('current-game-is-supported');
  },
  onGameChanged: (callback: (gameInfo: any) => void) => {
    ipcRenderer.on('current-game-changed', (event: any, gameInfo: any) => {
      callback(gameInfo);
    });
  },
  removeGameChangedListener: () => {
    ipcRenderer.removeAllListeners('current-game-changed');
  }
});

contextBridge.exposeInMainWorld('widget', {
  createWidget: () => {
    return ipcRenderer.invoke('createWidget');
  },
  toggleWidget: () => {
    return ipcRenderer.invoke('toggleWidget');
  },
  getHotkeyInfo: () => {
    return ipcRenderer.invoke('hotkeys-get-info', 'widget-toggle');
  }
});

contextBridge.exposeInMainWorld('sensitivityConverter', {
  getSuggestedForCurrentGame: () => {
    return ipcRenderer.invoke('sensitivity-get-suggested-for-current-game');
  },
  getAllConversionsFromBaseline: () => {
    return ipcRenderer.invoke('sensitivity-get-all-conversions');
  },
  calculateMouseTravelFromGame: (gameData: any, sensitivity: number, dpi: number) => {
    return ipcRenderer.invoke('sensitivity-convert-from-game', gameData, sensitivity, dpi);
  },
  getCurrentMouseTravel: () => {
    return ipcRenderer.invoke('sensitivity-get-current-mouse-travel');
  },
  getTrueSens: () => ipcRenderer.invoke('sensitivity-get-true-sens'),
});

contextBridge.exposeInMainWorld('hotkeys', {
  getAllHotkeys: () => {
    return ipcRenderer.invoke('hotkeys-get-all');
  },
  updateHotkey: (id: string, updates: any) => {
    return ipcRenderer.invoke('hotkeys-update', id, updates);
  },
  resetToDefaults: () => {
    return ipcRenderer.invoke('hotkeys-reset');
  },
  getHotkeyInfo: (id: string) => {
    return ipcRenderer.invoke('hotkeys-get-info', id);
  },
  onHotkeyChanged: (callback: (id: string, updates: any) => void) => {
    ipcRenderer.on('hotkey-changed', (event: any, id: string, updates: any) => {
      callback(id, updates);
    });
  },
  onHotkeysReset: (callback: () => void) => {
    ipcRenderer.on('hotkeys-reset', (event: any) => {
      callback();
    });
  },
  removeHotkeyListeners: () => {
    ipcRenderer.removeAllListeners('hotkey-changed');
    ipcRenderer.removeAllListeners('hotkeys-reset');
  }
});

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.invoke('minimize-window'),
  close: () => ipcRenderer.invoke('close-window')
});

contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (channel: string, func: (...args: any[]) => void) => {
    ipcRenderer.on(channel, (event: any, ...args: any[]) => func(...args));
  },
  removeAllListeners: (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
  }
});


