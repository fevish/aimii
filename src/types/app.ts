export type { GameData } from '../data/games.data';

export interface BaselineSettings {
  mouseTravel: number; // PRIMARY: cm for 360° turn - the core metric
  dpi: number; // user's mouse DPI setting
  trueSens: number; // derived: Math.round(mouseTravel * 10) - alternative representation
  favoriteGame: string; // user's chosen reference game
  favoriteSensitivity: number; // sensitivity for favoriteGame at 'dpi'
  eDPI: number; // derived for display: dpi * favoriteSensitivity - not used in calculations
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