// Conversion parameters interface for flexible game-specific conversions
export interface ConversionParams {
  linearCoefficient?: number; // Linear coefficient (was 'a')
  offset?: number; // Offset value (was 'b')
  multiplier?: number; // Multiplier for special conversions (was 'c')
  baseValue?: number; // Base value (for exponential)
  scaleFactor?: number; // Scale factor (for exponential)
  constant?: number; // Constant value
}

export interface GameData {
  game: string;
  processName?: string;
  scalingFactor: number;
  owGameId: string;
  owConstant?: string;
  owGameName?: string;
  enable_for_app: boolean;
  specialConversion?: boolean;
  conversionParams?: ConversionParams;
}

export const gamesData: GameData[] = [
  {
    game: 'Apex Legends',
    scalingFactor: 0.02199999511,
    owGameId: '21566',
    owConstant: 'ApexLegends',
    owGameName: 'Apex Legends',
    enable_for_app: true
  },
  {
    game: 'ARC Raiders',
    scalingFactor: 0.001555424552,
    owGameId: '27168',
    enable_for_app: true
  },
  {
    game: 'Call of Duty (All Games)',
    processName: 'cod.exe',
    scalingFactor: 0.00660000176,
    owGameId: '',
    enable_for_app: true
  },
  {
    game: 'Counter-Strike 2',
    processName: 'cs2.exe',
    scalingFactor: 0.022,
    owGameId: '22730',
    owConstant: 'CounterStrike2',
    owGameName: 'Counter-Strike 2',
    enable_for_app: true
  },
  {
    game: 'Deadlock',
    scalingFactor: 0.04400009777,
    owGameId: '24482',
    owConstant: 'Deadlock',
    owGameName: 'Deadlock',
    enable_for_app: false
  },
  {
    game: 'Destiny 2',
    processName: 'destiny2.exe',
    scalingFactor: 0.00660000176,
    owGameId: '0',
    enable_for_app: true
  },
  {
    game: 'Escape From Tarkov',
    scalingFactor: 0.125,
    owGameId: '21634',
    owConstant: 'EscapeFromTarkov',
    owGameName: 'Escape From Tarkov',
    enable_for_app: true
  },
  {
    game: 'Fortnite',
    scalingFactor: 0.00555500005,
    owGameId: '21216',
    owConstant: 'Fortnite',
    owGameName: 'Fortnite',
    enable_for_app: true
  },
  {
    game: 'Halo Infinite',
    scalingFactor: 0.0225,
    owGameId: '21854',
    owConstant: 'HaloInfinite',
    owGameName: 'Halo Infinite',
    enable_for_app: true
  },
  {
    game: 'Helldivers 2',
    scalingFactor: 0.57295,
    owGameId: '24000',
    owConstant: 'Helldivers2',
    owGameName: 'Helldivers 2',
    enable_for_app: false
  },
  {
    game: 'Left 4 Dead 2',
    processName: 'left4dead2.exe',
    scalingFactor: 0.02199999511,
    owGameId: '0',
    enable_for_app: true
  },
  {
    game: 'Marvel Rivals',
    scalingFactor: 0.01749999027,
    owGameId: '24890',
    owConstant: 'MarvelRivals',
    owGameName: 'Marvel Rivals',
    enable_for_app: true
  },
  {
    game: 'Minecraft Java',
    scalingFactor: 1.0,
    specialConversion: true,
    conversionParams: { linearCoefficient: 1.2, offset: 0.6, multiplier: 0.005, constant: 0.2, scaleFactor: 0.003 },
    owGameId: '8032',
    owConstant: 'MinecraftJavaEdition',
    owGameName: 'Minecraft: Java Edition',
    enable_for_app: true
  },
  {
    game: 'Overwatch 2',
    scalingFactor: 0.0066,
    owGameId: '10844',
    owConstant: 'Overwatch2',
    owGameName: 'Overwatch 2',
    enable_for_app: true
  },
  {
    game: 'PUBG',
    scalingFactor: 1.0,
    specialConversion: true,
    conversionParams: { baseValue: 114.80, scaleFactor: 21.769 },
    owGameId: '10906',
    owConstant: 'PUBG',
    owGameName: 'PlayerUnknown\'s Battlegrounds',
    enable_for_app: true
  },
  {
    game: 'Rainbow Six Siege',
    scalingFactor: 0.005729577951,
    owGameId: '10826',
    owConstant: 'RainbowSixSiege',
    owGameName: 'Rainbow Six Siege',
    enable_for_app: true
  },
  {
    game: 'Roblox',
    scalingFactor: 0.39789557451,
    owGameId: '4688',
    owConstant: 'Roblox',
    owGameName: 'Roblox',
    enable_for_app: false
  },
  {
    game: 'Splitgate 2',
    scalingFactor: 0.01117268501,
    owGameId: '25884',
    owConstant: 'Splitgate2',
    owGameName: 'Splitgate 2',
    enable_for_app: false
  },
  {
    game: 'THE FINALS',
    scalingFactor: 0.001,
    owGameId: '23478',
    owConstant: 'THEFINALS',
    owGameName: 'THE FINALS',
    enable_for_app: false
  },
  {
    game: 'Valorant',
    processName: 'VALORANT-Win64-Shipping.exe',
    scalingFactor: 0.07000016952,
    owGameId: '21640',
    owConstant: 'Valorant',
    owGameName: 'Valorant',
    enable_for_app: true
  }
];
