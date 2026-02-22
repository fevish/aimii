export interface AimTrainerConfig {
  resolution: { width: number; height: number };
  fullscreen: boolean;
  emulateGame: string;
  emulateSensitivity: number;
  /** User's cm/360° (mouse travel). Used to match look sensitivity to their preference. */
  mouseTravel?: number;
  /** User's DPI. With mouseTravel, used to compute radians-per-pixel for look. */
  dpi?: number;
}
