import { CanonicalSettings, GameData, HotkeyInfo } from './app';
import { CurrentGameInfo } from '../browser/services/current-game.service';
import { SensitivityConversion } from '../browser/services/sensitivity-converter.service';

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      APP_VERSION: string;
    }
  }

  interface Window {
    games: {
      getAllGames: () => Promise<GameData[]>;
      getEnabledGames: () => Promise<GameData[]>;
      getGameSummary: () => Promise<string>;
      getEnabledGameIds: () => Promise<number[]>;
    };
    settings: {
      getCanonicalSettings: () => Promise<CanonicalSettings | null>;
      setCanonicalSettings: (game: string, sensitivity: number, dpi: number) => Promise<boolean>;
      clearCanonicalSettings: () => Promise<boolean>;
      hasCanonicalSettings: () => Promise<boolean>;
      getTheme: () => Promise<string>;
      setTheme: (theme: string) => Promise<boolean>;
      onThemeChanged: (callback: (theme: string) => void) => void;
      removeThemeListener: () => void;
    };
    currentGame: {
      getCurrentGameInfo: () => Promise<CurrentGameInfo | null>;
      getAllDetectedGames: () => Promise<CurrentGameInfo[]>;
      setCurrentGame: (gameId: number) => Promise<boolean>;
      isGameRunning: () => Promise<boolean>;
      getCurrentGameName: () => Promise<string | null>;
      isCurrentGameSupported: () => Promise<boolean>;
      onGameChanged: (callback: (gameInfo: any) => void) => void;
      removeGameChangedListener: () => void;
    };
    widget: {
      createWidget: () => Promise<void>;
      toggleWidget: () => Promise<void>;
      getHotkeyInfo: () => Promise<HotkeyInfo>;
    };
    sensitivityConverter: {
      getSuggestedForCurrentGame: () => Promise<SensitivityConversion | null>;
      getAllConversions: () => Promise<SensitivityConversion[]>;
      convert: (fromGame: string, toGame: string, sensitivity: number, dpi: number) => Promise<SensitivityConversion | null>;
      getCanonicalCm360: () => Promise<number | null>;
    };
    windowControls: {
      minimize: () => void;
      close: () => void;
    };
    electronAPI?: {
      openExternalUrl: (url: string) => Promise<boolean>;
    };
  }
}

export {};