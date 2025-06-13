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


