import { GamesService } from './games.service';
import { SettingsService } from './settings.service';
import { BaselineSettings } from '../../types/app';
import { CurrentGameService } from './current-game.service';

export interface SensitivityConversion {
  gameName: string;
  suggestedSensitivity: number;
  mouseTravel: number; // cm/360° baseline
  userDPI: number;
  trueSens: number; // Add trueSens to the interface
}

export class SensitivityConverterService {
  constructor(
    private readonly gamesService: GamesService,
    private readonly settingsService: SettingsService,
    private readonly currentGameService: CurrentGameService
  ) {}

  /**
   * Calculate suggested sensitivity for the current game based on baseline settings
   */
  public getSuggestedSensitivityForCurrentGame(): SensitivityConversion | null {
    const baselineSettings = this.settingsService.getBaselineSettings();
    const currentGame = this.currentGameService.getCurrentGameInfo();

    if (!baselineSettings || !currentGame || !currentGame.isSupported) {
      return null;
    }

    const toGameData = currentGame.gameData;
    if (!toGameData) {
      return null;
    }

    const suggestedSensitivity = this.convertFromMouseTravel(
      baselineSettings.mouseTravel,
      baselineSettings.dpi,
      toGameData
    );

    if (suggestedSensitivity === null) {
      return null;
    }

    const trueSens = this.calculateTrueSens(baselineSettings.mouseTravel);

    return {
      gameName: currentGame.name,
      suggestedSensitivity,
      mouseTravel: baselineSettings.mouseTravel,
      userDPI: baselineSettings.dpi,
      trueSens // Include trueSens
    };
  }

  /**
   * Convert from mouseTravel baseline to a specific game's sensitivity
   */
  public convertFromMouseTravel(
    mouseTravel: number,
    dpi: number,
    toGameData: any
  ): number | null {
    if (!toGameData || mouseTravel <= 0 || dpi <= 0) {
      return null;
    }

    // Use the games service to convert from cm/360 to target game sensitivity
    return this.gamesService.calculateTargetSensitivity(
      toGameData,
      mouseTravel,
      dpi
    );
  }

  /**
   * Convert from game+sensitivity+DPI to mouseTravel (for onboarding)
   */
  public calculateMouseTravelFromGame(
    gameData: any,
    sensitivity: number,
    dpi: number
  ): number | null {
    if (!gameData || sensitivity <= 0 || dpi <= 0) {
      return null;
    }

    // Use the games service to calculate cm/360 from game settings
    return this.gamesService.calculateCm360(gameData, sensitivity, dpi);
  }

  /**
   * Get current user's mouseTravel value
   */
  public getCurrentMouseTravel(): number | null {
    const baselineSettings = this.settingsService.getBaselineSettings();
    return baselineSettings?.mouseTravel || null;
  }

  /**
   * Get all possible conversions from current baseline to supported games
   */
  public getAllConversionsFromBaseline(): SensitivityConversion[] {
    const baselineSettings = this.settingsService.getBaselineSettings();
    if (!baselineSettings) return [];

    const enabledGames = this.gamesService.getEnabledGames();
    const trueSens = this.calculateTrueSens(baselineSettings.mouseTravel);

    return enabledGames
      .map(game => {
        const suggestedSensitivity = this.convertFromMouseTravel(
          baselineSettings.mouseTravel,
          baselineSettings.dpi,
          game
        );

        if (suggestedSensitivity === null) {
          return null;
        }

        return {
          gameName: game.game,
          suggestedSensitivity,
          mouseTravel: baselineSettings.mouseTravel,
          userDPI: baselineSettings.dpi,
          trueSens // Include trueSens in each conversion
        };
      })
      .filter((conversion): conversion is SensitivityConversion => conversion !== null);
  }

  /**
   * Calculates True Sens from mouse travel (cm/360°)
   * Formula: cm/360 * 10, rounded to nearest whole number
   */
  public calculateTrueSens(mouseTravel: number): number {
    return Math.round(mouseTravel * 10);
  }
}
