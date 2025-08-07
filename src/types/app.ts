export interface GameData {
  game: string;
  sensitivityScalingFactor: number;
  owGameId: string;
  owConstant?: string;
  owGameName?: string;
  enable_for_app: boolean;
  processName?: string;
  specialConversion?: boolean;
  conversionParams?: Record<string, number>;
  scalingFactor?: number;
}

export interface CanonicalSettings {
  game: string;
  sensitivity: number;
  dpi: number;
  edpi: number;
}

export interface HotkeyInfo {
  keyCode: number;
  modifiers: { ctrl: boolean; shift: boolean; alt: boolean };
  displayText: string;
}

export interface HotkeyConfig extends HotkeyInfo {
  id: string;
}