import { BaselineSettings, GameData, HotkeyInfo } from './app';
import { CurrentGameInfo } from '../browser/services/current-game.service';
import { SensitivityConversion } from '../browser/services/sensitivity-converter.service';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_VERSION: string;
    }
  }

  interface Window {
    app: {
      initialize: () => Promise<void>;
    };
    gep: {
      onMessage: (func: (...args: any[]) => void) => void;
      setRequiredFeature: () => Promise<any>;
      getInfo: () => Promise<any>;
      restartInitialization: () => Promise<any>;
    };
    electronAPI: {
      openWidgetDevTools: () => Promise<void>;
      openExternalUrl: (url: string) => void;
    };
    games: {
      getAllGames: () => Promise<GameData[]>;
      getEnabledGames: () => Promise<GameData[]>;
      getGameSummary: () => Promise<string>;
      getEnabledGameIds: () => Promise<number[]>;
    };
    widget: {
      createWidget: () => Promise<void>;
      toggleWidget: () => Promise<void>;
      updateWidgetPosition: (x: number, y: number) => Promise<void>;
      getHotkeyInfo: () => Promise<HotkeyInfo>;
    };
    settings: {
      getBaselineSettings: () => Promise<BaselineSettings | null>;
      setBaselineSettings: (mouseTravel: number, dpi: number, favoriteGame?: string, favoriteSensitivity?: number, eDPI?: number) => Promise<boolean>;
      hasBaselineSettings: () => Promise<boolean>;
      clearBaselineSettings: () => Promise<boolean>;
      getTheme: () => Promise<string>;
      setTheme: (theme: string) => Promise<boolean>;
      onThemeChanged: (callback: (theme: string) => void) => void;
      removeThemeListener: () => void;
    };
    currentGame: {
      getCurrentGameInfo: () => Promise<any>;
      setCurrentGame: (gameId: number) => Promise<boolean>;
      getAllDetectedGames: () => Promise<any[]>;
      onGameChanged: (callback: (gameInfo: any) => void) => void;
      removeGameChangedListener: () => void;
    };
    sensitivityConverter: {
      getSuggestedForCurrentGame: () => Promise<any>;
      getAllConversionsFromBaseline: () => Promise<any[]>;
      getCurrentMouseTravel: () => Promise<number | null>;
      calculateMouseTravelFromGame: (gameData: any, sensitivity: number, dpi: number) => Promise<number | null>;
      getTrueSens: () => Promise<number | null>;
    };
    windowControls: {
      minimize: () => void;
      close: () => void;
    };
    cmp: {
      isRequired: () => Promise<boolean>;
      openPrivacySettings: (options?: any) => Promise<void>;
      isFirstTimeUser: () => Promise<boolean>;
    };
    ipcRenderer: {
      on: (channel: string, func: (...args: any[]) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

// Extend JSX namespace for custom elements
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      owadview: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};