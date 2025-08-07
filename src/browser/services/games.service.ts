import { gamesData, GameData } from '../../data/games.data';

export class GamesService {
  private games: GameData[] = [];

  constructor() {
    this.games = gamesData;
  }

  public getAllGames(): GameData[] {
    return this.games;
  }

  public getEnabledGames(): GameData[] {
    return this.games.filter(game => game.enable_for_app);
  }

  public getGameByName(gameName: string): GameData | undefined {
    return this.games.find(game => game.game === gameName);
  }

  public getGameByOwId(owGameId: string): GameData | undefined {
    return this.games.find(game => game.owGameId === owGameId);
  }

  /**
   * Get enabled game by Overwolf ID - for game detection
   * Only returns games that are enabled for the app
   */
  public getEnabledGameByOwId(owGameId: string): GameData | undefined {
    return this.games.find(game => game.owGameId === owGameId && game.enable_for_app);
  }

  /**
   * Get enabled game by name - for canonical game selection
   * Only returns games that are enabled for the app
   */
  public getEnabledGameByName(gameName: string): GameData | undefined {
    return this.games.find(game => game.game === gameName && game.enable_for_app);
  }

  public getEnabledGameIds(): number[] {
    return this.getEnabledGames()
      .map(game => parseInt(game.owGameId))
      .filter(id => !isNaN(id));
  }

  public getEnabledGameNames(): string[] {
    return this.getEnabledGames().map(game => game.game);
  }

  public getGameSummary(): string {
    const enabled = this.getEnabledGames();
    const gameNames = enabled.map(game => `${game.game} (${game.owGameId})`).join(', ');
    return `${enabled.length} enabled games: ${gameNames}`;
  }

  /**
   * Calculate cm/360° from game sensitivity and DPI
   * Uses game-specific conversion parameters when available, falls back to standard scaling
   */
  public calculateCm360(game: GameData, sensitivity: number, dpi: number): number {
    if (game.specialConversion && game.conversionParams) {
      try {
        const params = game.conversionParams;
        let inches360: number;

        // Battlefield-style: ((linearCoefficient * sensitivity + offset) * multiplier) * dpi
        if (params.linearCoefficient && params.offset && params.multiplier) {
          inches360 = 360 / (((params.linearCoefficient * sensitivity + params.offset) * params.multiplier) * dpi);
        }
        // GTA5-style: constant / (dpi * (sensitivity + offset))
        else if (params.constant && params.offset) {
          inches360 = params.constant / (dpi * (sensitivity + params.offset));
        }
        // Minecraft-style: (linearCoefficient * Math.pow(offset * sensitivity * multiplier + constant, 3)) * dpi
        else if (params.linearCoefficient && params.offset && params.multiplier && params.constant && params.scaleFactor) {
          inches360 = 360 / (
            (
              params.linearCoefficient *
              Math.pow(
                params.offset * sensitivity * params.multiplier + params.constant,
                3
              )
            ) * dpi
          );
        }
        // PUBG-style: (Math.exp((sensitivity - baseValue) / scaleFactor)) * dpi
        else if (params.baseValue && params.scaleFactor) {
          inches360 = 360 / ((Math.exp((sensitivity - params.baseValue) / params.scaleFactor)) * dpi);
        }
        // STALKER-style: (linearCoefficient * (sensitivity + offset) / constant) * dpi
        else if (params.linearCoefficient && params.offset && params.constant) {
          inches360 = 360 / ((params.linearCoefficient * (sensitivity + params.offset) / params.constant) * dpi);
        }
        // First Descendant-style: ((sensitivity - offset) / constant) * dpi
        else if (params.offset && params.constant) {
          inches360 = 360 / (((sensitivity - params.offset) / params.constant) * dpi);
        } else {
          throw new Error(`Invalid conversion parameters for ${game.game}`);
        }

        return inches360 * 2.54; // Convert to cm
      } catch (error) {
        console.error(`Error in special conversion for ${game.game}:`, error);
        // Fall back to standard calculation
      }
    }

    // Standard calculation: 360 / (scalingFactor * sensitivity * dpi) * 2.54
    const inches360 = 360 / (game.scalingFactor * sensitivity * dpi);
    return inches360 * 2.54; // Convert inches to cm
  }

  /**
   * Calculate target sensitivity from cm/360° and target DPI
   * Uses game-specific conversion parameters when available, falls back to standard scaling
   */
  public calculateTargetSensitivity(game: GameData, cm360: number, targetDPI: number): number {
    if (game.specialConversion && game.conversionParams) {
      try {
        const params = game.conversionParams;
        const inches360 = cm360 / 2.54; // Convert cm to inches

        // Battlefield-style inverse: ((360/(inches360 * multiplier)) - offset) / linearCoefficient
        if (params.linearCoefficient && params.offset && params.multiplier) {
          return ((360 / (inches360 * params.multiplier)) - params.offset) / params.linearCoefficient;
        }

        // GTA5-style inverse: (constant / (targetDPI * inches360)) - offset
        if (params.constant && params.offset) {
          return (params.constant / (targetDPI * inches360)) - params.offset;
        }

        // Minecraft-style inverse: (Math.pow((360/(linearCoefficient * targetDPI * inches360)), 1/3) - constant) / scaleFactor
        if (params.linearCoefficient && params.offset && params.multiplier && params.constant && params.scaleFactor) {
          return (Math.pow((360 / (params.linearCoefficient * targetDPI * inches360)), 1 / 3) - params.constant) / params.scaleFactor;
        }

        // PUBG-style inverse: baseValue + scaleFactor * Math.log(360 / (targetDPI * inches360))
        if (params.baseValue && params.scaleFactor) {
          return params.baseValue + params.scaleFactor * Math.log(360 / (targetDPI * inches360));
        }

        // STALKER-style inverse: (360 * constant / (linearCoefficient * targetDPI * inches360)) - offset
        if (params.linearCoefficient && params.offset && params.constant) {
          return (360 * params.constant / (params.linearCoefficient * targetDPI * inches360)) - params.offset;
        }

        // First Descendant-style inverse: (360 * constant / (targetDPI * inches360)) + offset
        if (params.offset && params.constant) {
          return (360 * params.constant / (targetDPI * inches360)) + params.offset;
        }

        throw new Error(`Invalid conversion parameters for ${game.game}`);

      } catch (error) {
        console.error(`Error in special conversion for ${game.game}:`, error);
        // Fall back to standard calculation
      }
    }

    // Standard calculation: 360 / (scalingFactor * targetDPI * inches360)
    const inches360 = cm360 / 2.54;
    return 360 / (game.scalingFactor * targetDPI * inches360);
  }

  public convertSensitivity(
    sourceGame: GameData,
    targetGame: GameData,
    sourceSensitivity: number,
    sourceDPI: number,
    targetDPI: number
  ): { targetSensitivity: number; cm360: number } {
    // Convert to cm/360 (universal measurement)
    const cm360 = this.calculateCm360(sourceGame, sourceSensitivity, sourceDPI);

    // Convert from cm/360 to target game sensitivity
    const targetSensitivity = this.calculateTargetSensitivity(targetGame, cm360, targetDPI);

    return { targetSensitivity, cm360 };
  }
}
