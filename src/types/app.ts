export interface GameData {
  game: string;
  sensitivityScalingFactor: number;
  owGameId: string;
  owConstant?: string;
  owGameName?: string;
  enable_for_app: boolean;
}

export interface BaselineSettings {
  mouseTravel: number; // cm for 360° turn
  dpi: number;
  trueSens: number; // derived: Math.round(mouseTravel * 10)
  favoriteGame: string; // user's chosen canonical game
  favoriteSensitivity: number; // sensitivity for favoriteGame at 'dpi'
  eDPI: number; // derived: dpi * favoriteSensitivity
}

export interface HotkeyInfo {
  keyCode: number;
  modifiers: { ctrl: boolean; shift: boolean; alt: boolean };
  displayText: string;
}

export interface HotkeyConfig {
  id: string;
  name: string;
  keyCode: number;
  modifiers: {
    ctrl: boolean;
    shift: boolean;
    alt: boolean;
  };
  description: string;
  enabled: boolean;
}

export interface SensitivityConversion {
  gameName: string;
  suggestedSensitivity: number;
  mouseTravel: number;
  userDPI: number;
  trueSens: number; // Add trueSens to the interface
}