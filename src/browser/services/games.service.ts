import * as fs from 'fs';
import * as path from 'path';

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
  private gamesPath: string;

  constructor() {
    // Try multiple possible paths for games.json
    const possiblePaths = [
      path.join(__dirname, '../data/games.json'),
      path.join(__dirname, '../../data/games.json'),
      path.join(process.cwd(), 'src/data/games.json'),
      path.join(process.cwd(), 'data/games.json')
    ];

    this.gamesPath = '';
    for (const testPath of possiblePaths) {
      if (fs.existsSync(testPath)) {
        this.gamesPath = testPath;
        break;
      }
    }

    if (!this.gamesPath) {
      console.error('games.json not found in any of the expected locations:', possiblePaths);
      // Fallback to a default path
      this.gamesPath = possiblePaths[0];
    }

    this.loadGames();
  }

  private loadGames(): void {
    try {
      if (fs.existsSync(this.gamesPath)) {
        const data = fs.readFileSync(this.gamesPath, 'utf8');
        this.games = JSON.parse(data);
        console.log(`Loaded ${this.games.length} games from games.json at: ${this.gamesPath}`);
      } else {
        console.error('games.json not found at:', this.gamesPath);
        // Provide fallback data for development
        this.games = this.getFallbackGames();
        console.log('Using fallback games data');
      }
    } catch (error) {
      console.error('Error loading games.json:', error);
      this.games = this.getFallbackGames();
      console.log('Using fallback games data due to error');
    }
  }

  private getFallbackGames(): GameData[] {
    return [
      {
        "game": "Aimlab",
        "sensitivityScalingFactor": 0.05,
        "owGameId": "21796",
        "owConstant": "Aimlab",
        "owGameName": "Aim Lab",
        "enable_for_app": true
      },
      {
        "game": "Apex Legends",
        "sensitivityScalingFactor": 0.02199999511,
        "owGameId": "21566",
        "owConstant": "ApexLegends",
        "owGameName": "Apex Legends",
        "enable_for_app": true
      },
      {
        "game": "Counter-Strike 2",
        "sensitivityScalingFactor": 0.02199999511,
        "owGameId": "22730",
        "owConstant": "CounterStrike2",
        "owGameName": "Counter-Strike 2",
        "enable_for_app": true
      },
      {
        "game": "Valorant",
        "sensitivityScalingFactor": 0.07,
        "owGameId": "21640",
        "owConstant": "Valorant",
        "owGameName": "Valorant",
        "enable_for_app": true
      }
    ];
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