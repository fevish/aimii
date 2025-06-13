console.log('** preload **')
const { contextBridge, ipcRenderer  } = require('electron');

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
    ipcRenderer.on('console-message',(e: any, ...args: any[]) => {
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

contextBridge.exposeInMainWorld('osr', {
  openOSR: () => {
    return ipcRenderer.invoke('createOSR');
  },
  toggle: () => {
    return ipcRenderer.invoke('toggleOSRVisibility');
  },
  updateHotkey: () => {
    return ipcRenderer.invoke('updateHotkey');
  },
});

contextBridge.exposeInMainWorld('overlay', {
  setExclusiveModeType: (mode: any) => {
    return ipcRenderer.invoke('EXCLUSIVE_TYPE', mode);
  },
  setExclusiveModeHotkeyBehavior: (behavior: any) => {
    return ipcRenderer.invoke('EXCLUSIVE_BEHAVIOR',behavior );
  },
  updateExclusiveOptions: (options: any) => {
    return ipcRenderer.invoke('updateExclusiveOptions', options);
  }
});

contextBridge.exposeInMainWorld('electronAPI', {
  openWidgetDevTools: () => {
    return ipcRenderer.invoke('openWidgetDevTools');
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
  getCanonicalSettings: () => {
    return ipcRenderer.invoke('settings-get-canonical');
  },
  setCanonicalSettings: (game: string, sensitivity: number, dpi: number) => {
    return ipcRenderer.invoke('settings-set-canonical', game, sensitivity, dpi);
  },
  hasCanonicalSettings: () => {
    return ipcRenderer.invoke('settings-has-canonical');
  }
});

contextBridge.exposeInMainWorld('currentGame', {
  getCurrentGameInfo: () => {
    return ipcRenderer.invoke('current-game-get-info');
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
    return ipcRenderer.invoke('widget-get-hotkey-info');
  }
});

contextBridge.exposeInMainWorld('sensitivityConverter', {
  getSuggestedForCurrentGame: () => {
    return ipcRenderer.invoke('sensitivity-get-suggested-for-current-game');
  },
  getAllConversions: () => {
    return ipcRenderer.invoke('sensitivity-get-all-conversions');
  },
  convert: (fromGame: string, toGame: string, sensitivity: number, dpi: number) => {
    return ipcRenderer.invoke('sensitivity-convert', fromGame, toGame, sensitivity, dpi);
  }
});


