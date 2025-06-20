import { GamesService } from "./games.service";
import { SettingsService } from "./settings.service";
import { CurrentGameService } from "./current-game.service";

export interface SensitivityConversion {
  fromGame: string;
  toGame: string;
  fromSensitivity: number;
  fromDPI: number;
  suggestedSensitivity: number;
  cm360: number; // cm/360° for reference
  isSpecialConversion: boolean;
}

export class SensitivityConverterService {
  constructor(
    private readonly gamesService: GamesService,
    private readonly settingsService: SettingsService,
    private readonly currentGameService: CurrentGameService
  ) {}

  /**
   * Calculate suggested sensitivity for the current game based on canonical settings
   */
  public getSuggestedSensitivityForCurrentGame(): SensitivityConversion | null {
    const canonicalSettings = this.settingsService.getCanonicalSettings();
    const currentGame = this.currentGameService.getCurrentGameInfo();

    // console.log('Canonical settings:', canonicalSettings);
    // console.log('Current game:', currentGame);

    if (!canonicalSettings || !currentGame || !currentGame.isSupported) {
      console.log('Missing data - no conversion possible');
      return null;
    }

    // Don't suggest conversion if we're already in the canonical game
    if (canonicalSettings.game === currentGame.name) {
      console.log('Already in canonical game - no conversion needed');
      return null;
    }

    const fromGameData = this.gamesService.getGameByName(canonicalSettings.game);
    const toGameData = currentGame.gameData;

    // console.log('From game data:', fromGameData);
    // console.log('To game data:', toGameData);

    if (!fromGameData || !toGameData) {
      console.log('Game data not found');
      return null;
    }

    const result = this.convertSensitivity(
      fromGameData,
      toGameData,
      canonicalSettings.sensitivity,
      canonicalSettings.dpi
    );

    // console.log('Conversion result:', result);

    return result;
  }

  /**
   * Convert sensitivity between two games using GamesService methods
   */
  public convertSensitivity(
    fromGame: any,
    toGame: any,
    sensitivity: number,
    dpi: number
  ): SensitivityConversion {
    // Use the existing GamesService conversion method
    const conversion = this.gamesService.convertSensitivity(
      fromGame,
      toGame,
      sensitivity,
      dpi,
      dpi // Use same DPI for target
    );

    return {
      fromGame: fromGame.game,
      toGame: toGame.game,
      fromSensitivity: sensitivity,
      fromDPI: dpi,
      suggestedSensitivity: Math.round(conversion.targetSensitivity * 1000) / 1000, // Round to 3 decimal places
      cm360: Math.round(conversion.cm360 * 100) / 100, // Round to 2 decimal places
      isSpecialConversion: fromGame.specialConversion || toGame.specialConversion
    };
  }

  /**
   * Get all possible conversions from canonical settings to all supported games
   */
  public getAllConversionsFromCanonical(): SensitivityConversion[] {
    const canonicalSettings = this.settingsService.getCanonicalSettings();
    if (!canonicalSettings) {
      return [];
    }

    const fromGameData = this.gamesService.getGameByName(canonicalSettings.game);
    if (!fromGameData) {
      return [];
    }

    const allGames = this.gamesService.getEnabledGames();
    const conversions: SensitivityConversion[] = [];

    for (const toGame of allGames) {
      // Skip conversion to the same game
      if (toGame.game === canonicalSettings.game) {
        continue;
      }

      const conversion = this.convertSensitivity(
        fromGameData,
        toGame,
        canonicalSettings.sensitivity,
        canonicalSettings.dpi
      );
      conversions.push(conversion);
    }

    return conversions.sort((a, b) => a.toGame.localeCompare(b.toGame));
  }
}