/**
 * Shared sensitivity conversion logic (no Electron/browser deps).
 * Used by GamesService (main) and SensitivityCalculator (renderer).
 */
import type { GameData } from '../data/games.data';

/**
 * Calculate cm/360° from game sensitivity and DPI.
 */
export function calculateCm360(game: GameData, sensitivity: number, dpi: number): number {
  if (game.specialConversion && game.conversionParams) {
    try {
      const params = game.conversionParams;
      let inches360: number;

      if (params.linearCoefficient != null && params.offset != null && params.multiplier != null) {
        inches360 = 360 / (((params.linearCoefficient * sensitivity + params.offset) * params.multiplier) * dpi);
      } else if (params.constant != null && params.offset != null) {
        inches360 = params.constant / (dpi * (sensitivity + params.offset));
      } else if (
        params.linearCoefficient != null &&
        params.offset != null &&
        params.multiplier != null &&
        params.constant != null &&
        params.scaleFactor != null
      ) {
        inches360 =
          360 /
          (params.linearCoefficient *
            Math.pow(params.offset * sensitivity * params.multiplier + params.constant, 3) *
            dpi);
      } else if (params.baseValue != null && params.scaleFactor != null) {
        inches360 = 360 / (Math.exp((sensitivity - params.baseValue) / params.scaleFactor) * dpi);
      } else if (
        params.linearCoefficient != null &&
        params.offset != null &&
        params.constant != null
      ) {
        inches360 =
          360 / (((params.linearCoefficient * (sensitivity + params.offset)) / params.constant) * dpi);
      } else if (params.offset != null && params.constant != null) {
        inches360 = 360 / (((sensitivity - params.offset) / params.constant) * dpi);
      } else {
        throw new Error(`Invalid conversion parameters for ${game.game}`);
      }

      return inches360 * 2.54;
    } catch (error) {
      console.error(`Error in special conversion for ${game.game}:`, error);
    }
  }

  const inches360 = 360 / (game.scalingFactor * sensitivity * dpi);
  return inches360 * 2.54;
}

/**
 * Calculate target sensitivity from cm/360° and target DPI.
 */
export function calculateTargetSensitivity(game: GameData, cm360: number, targetDPI: number): number {
  if (game.specialConversion && game.conversionParams) {
    try {
      const params = game.conversionParams;
      const inches360 = cm360 / 2.54;

      if (params.linearCoefficient != null && params.offset != null && params.multiplier != null) {
        return (360 / (inches360 * params.multiplier) - params.offset) / params.linearCoefficient;
      }
      if (params.constant != null && params.offset != null) {
        return params.constant / (targetDPI * inches360) - params.offset;
      }
      if (
        params.linearCoefficient != null &&
        params.offset != null &&
        params.multiplier != null &&
        params.constant != null &&
        params.scaleFactor != null
      ) {
        return (
          (Math.pow(360 / (params.linearCoefficient * targetDPI * inches360), 1 / 3) - params.constant) /
          params.scaleFactor
        );
      }
      if (params.baseValue != null && params.scaleFactor != null) {
        return params.baseValue + params.scaleFactor * Math.log(360 / (targetDPI * inches360));
      }
      if (
        params.linearCoefficient != null &&
        params.offset != null &&
        params.constant != null
      ) {
        return (360 * params.constant) / (params.linearCoefficient * targetDPI * inches360) - params.offset;
      }
      if (params.offset != null && params.constant != null) {
        return (360 * params.constant) / (targetDPI * inches360) + params.offset;
      }

      throw new Error(`Invalid conversion parameters for ${game.game}`);
    } catch (error) {
      console.error(`Error in special conversion for ${game.game}:`, error);
    }
  }

  const inches360 = cm360 / 2.54;
  return 360 / (game.scalingFactor * targetDPI * inches360);
}
