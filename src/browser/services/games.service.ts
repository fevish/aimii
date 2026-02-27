import { gamesData, GameData } from '../../data/games.data';
import { calculateCm360, calculateTargetSensitivity } from '../../utils/sensitivity-conversion';

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

  public getEnabledGameByOwId(owGameId: string): GameData | undefined {
    return this.games.find(game => game.owGameId === owGameId && game.enable_for_app);
  }

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

  public calculateCm360(game: GameData, sensitivity: number, dpi: number): number {
    return calculateCm360(game, sensitivity, dpi);
  }

  public calculateTargetSensitivity(game: GameData, cm360: number, targetDPI: number): number {
    return calculateTargetSensitivity(game, cm360, targetDPI);
  }

  public convertSensitivity(
    sourceGame: GameData,
    targetGame: GameData,
    sourceSensitivity: number,
    sourceDPI: number,
    targetDPI: number
  ): { targetSensitivity: number; cm360: number } {
    const cm360 = calculateCm360(sourceGame, sourceSensitivity, sourceDPI);
    const targetSensitivity = calculateTargetSensitivity(targetGame, cm360, targetDPI);
    return { targetSensitivity, cm360 };
  }
}
