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