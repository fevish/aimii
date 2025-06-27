import { gamesData } from '../../data/games.data';

export interface GameData {
  game: string;
  sensitivityScalingFactor: number;
  owGameId: string;
  owConstant: string;
  owGameName: string;
  enable_for_app: boolean;
  specialConversion?: boolean;
  sourceFormula?: string;
  targetFormula?: string;
}

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

  public calculateCm360(game: GameData, sensitivity: number, dpi: number): number {
    if (game.specialConversion && game.sourceFormula) {
      // Handle special conversion games like Minecraft
      try {
        // This would need to be implemented based on the specific formula
        // For now, fall back to standard calculation
        console.warn(`Special conversion for ${game.game} not yet implemented, using standard calculation`);
      } catch (error) {
        console.error(`Error in special conversion for ${game.game}:`, error);
      }
    }

    // Standard calculation: (360 / (sensitivityScalingFactor * sensitivity * dpi)) * 2.54
    const inches360 = 360 / (game.sensitivityScalingFactor * sensitivity * dpi);
    return inches360 * 2.54; // Convert inches to cm
  }

  public calculateTargetSensitivity(game: GameData, cm360: number, targetDPI: number): number {
    if (game.specialConversion && game.targetFormula) {
      // Handle special conversion games like Minecraft
      try {
        // This would need to be implemented based on the specific formula
        console.warn(`Special conversion for ${game.game} not yet implemented, using standard calculation`);
      } catch (error) {
        console.error(`Error in special conversion for ${game.game}:`, error);
      }
    }

    // Standard calculation: 360 / (sensitivityScalingFactor * dpi * inches360)
    const inches360 = cm360 / 2.54;
    return 360 / (game.sensitivityScalingFactor * targetDPI * inches360);
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