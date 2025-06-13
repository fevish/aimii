import { OverlayService } from "./overlay.service";
import { GamesService } from "./games.service";

export interface CurrentGameInfo {
  id: number;
  name: string;
  owGameName: string;
  isSupported: boolean;
  gameData: any;
}

export class CurrentGameService {
  constructor(
    private readonly overlayService: OverlayService,
    private readonly gamesService: GamesService
  ) {}

  public getCurrentGameInfo(): CurrentGameInfo | null {
    const activeGame = this.overlayService.overlayApi?.getActiveGameInfo();
    if (!activeGame) {
      return null;
    }

    const overwolfGameId = activeGame.gameInfo.classId?.toString() || '';
    const overwolfGameName = activeGame.gameInfo.name || 'Unknown Game';
    // const owGameData = activeGame.gameInfo;
    // console.log('Overwolf Game Data:', owGameData);

    // Try to get game data from our games.json
    const gameData = this.gamesService.getGameByOwId(overwolfGameId);

    console.log('Found game data:', gameData ? gameData.game : 'NOT FOUND');

    if (!gameData) {
      // Let's also check all available games to see what IDs we have
      const allGames = this.gamesService.getAllGames();
      console.log('Available games in games.json:');
      allGames.forEach(game => {
        console.log(`- ${game.game}: owGameId="${game.owGameId}"`);
      });
    }

    console.log('===============================');

    return {
      id: activeGame.gameInfo.classId,
      name: gameData?.game || overwolfGameName,
      owGameName: gameData?.owGameName || overwolfGameName,
      isSupported: !!gameData,
      gameData: gameData || null
    };
  }

  public isGameRunning(): boolean {
    return this.getCurrentGameInfo() !== null;
  }

  public getCurrentGameName(): string | null {
    const gameInfo = this.getCurrentGameInfo();
    return gameInfo ? gameInfo.name : null;
  }

  public isCurrentGameSupported(): boolean {
    const gameInfo = this.getCurrentGameInfo();
    return gameInfo ? gameInfo.isSupported : false;
  }
}