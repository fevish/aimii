/** CS2 default horizontal FOV (degrees). Used as Aim Trainer default. */
export const AIM_TRAINER_DEFAULT_FOV = 90;

export interface AimTrainerConfig {
  resolution: { width: number; height: number };
  fullscreen: boolean;
  emulateGame: string;
  emulateSensitivity: number;
  /** Horizontal FOV in degrees (default CS2: 90). Affects Aim Trainer camera only. */
  fov?: number;
  /** User's cm/360° (mouse travel). Used to match look sensitivity to their preference. */
  mouseTravel?: number;
  /** User's DPI. With mouseTravel, used to compute radians-per-pixel for look. */
  dpi?: number;
}
