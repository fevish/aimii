import { exec } from 'child_process';
import EventEmitter from 'events';
import { GamesService } from './games.service';

export interface DetectedGame {
  processName: string;
  pid: string;
  memoryUsage: string;
  gameName?: string;
}

export class CustomGameDetectorService extends EventEmitter {
  private isRunning: boolean = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 1000; // Check every second
  private lastDetectedGames: DetectedGame[] = [];

  constructor(private readonly gamesService: GamesService) {
    super();
  }

  /**
   * Start monitoring for custom games
   */
  public startMonitoring(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // Do initial check
    this.checkRunningGames();

    // Set up periodic checking
    this.checkInterval = setInterval(() => {
      this.checkRunningGames();
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Stop monitoring for custom games
   */
  public stopMonitoring(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

          /**
   * Check for running games using tasklist command
   */
  private checkRunningGames(): void {
    exec('tasklist /FO CSV', (err, stdout) => {
      if (err) {
        console.error('Error running tasklist:', err);
        return;
      }

      // Parse the CSV tasklist output to find game processes
      const lines = stdout.split('\n').filter(line => line.trim());
      const gameProcesses = this.findGameProcessesFromCSV(lines);

      console.log(`Game processes detected:`, gameProcesses);

            // Store the detected games
      this.lastDetectedGames = gameProcesses;

      // Emit the detected games
      if (gameProcesses.length > 0) {
        this.emit('games-detected', gameProcesses);
      }

      // For now, just emit the raw output so we can see what we're working with
      this.emit('tasklist-output', stdout);
    });
  }

      /**
   * Find game processes in the CSV tasklist output
   */
  private findGameProcessesFromCSV(lines: string[]): DetectedGame[] {
    const gameProcesses: DetectedGame[] = [];

    // Get all enabled games with process names
    const enabledGames = this.gamesService.getAllGames().filter(game =>
      game.enable_for_app && game.processName
    );



    lines.forEach(line => {
      // Skip header lines
      if (line.includes('Image Name') || line.includes('"Image Name"')) {
        return;
      }

      // Parse CSV line (format: "ProcessName.exe","PID","SessionName","Session#","MemUsage")
      const matches = line.match(/"([^"]+)","([^"]+)","([^"]+)","([^"]+)","([^"]+)"/);
      if (matches) {
        const processName = matches[1];
        const pid = matches[2];
        const memoryUsage = matches[5];



        // Check if this process matches any of our enabled games
        const matchingGame = enabledGames.find(game =>
          game.processName && processName.toLowerCase() === game.processName.toLowerCase()
        );

                if (matchingGame) {
          gameProcesses.push({
            processName,
            pid,
            memoryUsage,
            gameName: matchingGame.game
          });
        }
      }
    });

    return gameProcesses;
  }

  /**
   * Check if a specific process is running
   */
  public isProcessRunning(processName: string): Promise<boolean> {
    return new Promise((resolve) => {
      exec('tasklist', (err, stdout) => {
        if (err) {
          console.error('Error checking process:', err);
          resolve(false);
          return;
        }

        const isRunning = stdout.toLowerCase().includes(processName.toLowerCase());
        resolve(isRunning);
      });
    });
  }

  /**
   * Get the last detected games
   */
  public getLastDetectedGames(): DetectedGame[] {
    return this.lastDetectedGames;
  }
}