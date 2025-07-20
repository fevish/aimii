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
    game: "Aimlab",
    scalingFactor: 0.05,
    owGameId: "0",
    owConstant: "Aimlab",
    owGameName: "Aim Lab",
    enable_for_app: false
  },
  {
    game: "Apex Legends",
    scalingFactor: 0.02199999511,
    owGameId: "21566",
    owConstant: "ApexLegends",
    owGameName: "Apex Legends",
    enable_for_app: true
  },
  {
    game: "Arena Breakout: Infinite",
    scalingFactor: 0.10237393,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "ARK: Survival Evolved",
    scalingFactor: 0.17498152972,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Back 4 Blood",
    scalingFactor: 0.00136097503,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "BattleBit Remastered",
    scalingFactor: 0.0005,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Battlefield 1",
    scalingFactor: 0.0015,
    specialConversion: true,
    conversionParams: { linearCoefficient: 0.0015, offset: 0.005, multiplier: 2.29183118052 },
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Battlefield 2042",
    scalingFactor: 0.0015,
    specialConversion: true,
    conversionParams: { linearCoefficient: 0.0015, offset: 0.005, multiplier: 2.29183118052 },
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Battlefield 4",
    scalingFactor: 0.0015,
    specialConversion: true,
    conversionParams: { linearCoefficient: 0.0015, offset: 0.005, multiplier: 2.29183118052 },
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Battlefield V",
    scalingFactor: 0.0015,
    specialConversion: true,
    conversionParams: { linearCoefficient: 0.0015, offset: 0.005, multiplier: 2.29183118052 },
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Black Squad",
    scalingFactor: 0.00549316406,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Borderlands 3",
    scalingFactor: 0.00699929929,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Call of Duty: Black Ops 4",
    scalingFactor: 0.00660000176,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Call of Duty: Black Ops 6",
    scalingFactor: 0.00660000176,
    owGameId: "24542",
    owConstant: "CallOfDutyBlackOps6",
    owGameName: "Call of Duty: Black Ops 6",
    enable_for_app: true
  },
  {
    game: "Call of Duty: Black Ops Cold War",
    scalingFactor: 0.00660000176,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Call of Duty: Modern Warfare (2019)",
    scalingFactor: 0.00660000176,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Call of Duty: Modern Warfare 2 (2022)",
    scalingFactor: 0.00660000176,
    owGameId: "22328",
    owConstant: "CallOfDutyModernWarfare22022",
    owGameName: "Call of Duty: Modern Warfare 2 (2022)",
    enable_for_app: false
  },
  {
    game: "Call of Duty: Modern Warfare 3 (2023)",
    scalingFactor: 0.00660000176,
    owGameId: "23424",
    owConstant: "CallOfDutyModernWarfare32023",
    owGameName: "Call of Duty: Modern Warfare 3 (2023)",
    enable_for_app: false
  },
  {
    game: "Call of Duty: Vanguard",
    scalingFactor: 0.00660000176,
    owGameId: "21876",
    owConstant: "CallOfDutyVanguard",
    owGameName: "Call of Duty: Vanguard",
    enable_for_app: false
  },
  {
    game: "Call of Duty: Warzone",
    scalingFactor: 0.00660000176,
    owGameId: "24542",
    owConstant: "CallOfDutyWarzone",
    owGameName: "Call of Duty: Warzone",
    enable_for_app: false
  },
  {
    game: "Combat Master",
    scalingFactor: 0.001,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "CS 1.6",
    scalingFactor: 0.02199999511,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Counter-Strike 2",
    processName: "cs2.exe",
    scalingFactor: 0.02199999511,
    owGameId: "22730",
    owConstant: "CounterStrike2",
    owGameName: "Counter-Strike 2",
    enable_for_app: true
  },
  {
    game: "CS:GO",
    scalingFactor: 0.02199999511,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "CS:S",
    scalingFactor: 0.02199999511,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Cyberpunk 2077",
    scalingFactor: 0.01,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Deadlock",
    scalingFactor: 0.04400009777,
    owGameId: "24482",
    owConstant: "Deadlock",
    owGameName: "Deadlock",
    enable_for_app: false
  },
  {
    game: "Delta Force",
    scalingFactor: 0.01,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Destiny 2",
    scalingFactor: 0.00660000176,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "DOOM Eternal",
    scalingFactor: 0.02199999511,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Dying Light 2",
    scalingFactor: 0.00833333333,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Escape From Tarkov",
    scalingFactor: 0.125,
    owGameId: "21634",
    owConstant: "EscapeFromTarkov",
    owGameName: "Escape From Tarkov",
    enable_for_app: true
  },
  {
    game: "Fallout 4",
    scalingFactor: 3.77992440151,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Fallout 76",
    scalingFactor: 3.77992440151,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Far Cry 5",
    scalingFactor: 0.00179960012,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Fortnite",
    scalingFactor: 0.00555500005,
    owGameId: "21216",
    owConstant: "Fortnite",
    owGameName: "Fortnite",
    enable_for_app: true
  },
  {
    game: "FragPunk",
    scalingFactor: 0.05555006912,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Garry's Mod",
    scalingFactor: 0.02199999511,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Gray Zone Warfare",
    scalingFactor: 0.063,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "GTA 5 (TPP)",
    scalingFactor: 1.0,
    specialConversion: true,
    conversionParams: { constant: 66124.8, offset: 6.024 },
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Half-Life 2",
    scalingFactor: 0.02199999511,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Halo Infinite",
    scalingFactor: 0.0225,
    owGameId: "21854",
    owConstant: "HaloInfinite",
    owGameName: "Halo Infinite",
    enable_for_app: false
  },
  {
    game: "Halo: Reach",
    scalingFactor: 0.02222222222,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Helldivers 2",
    scalingFactor: 0.57295,
    owGameId: "24000",
    owConstant: "Helldivers2",
    owGameName: "Helldivers 2",
    enable_for_app: false
  },
  {
    game: "Heroes & Generals",
    scalingFactor: 0.1512605042,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Hunt: Showdown",
    scalingFactor: 0.04297173414,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Insurgency: Sandstorm",
    scalingFactor: 0.13999937778,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Left 4 Dead 2",
    scalingFactor: 0.02199999511,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Marvel Rivals",
    scalingFactor: 0.01749999027,
    owGameId: "24890",
    owConstant: "MarvelRivals",
    owGameName: "Marvel Rivals",
    enable_for_app: false
  },
  {
    game: "Minecraft: Java Edition",
    scalingFactor: 1.0,
    specialConversion: true,
    conversionParams: { linearCoefficient: 1.2, offset: 0.6, multiplier: 0.005, constant: 0.2, scaleFactor: 0.003 },
    owGameId: "8032",
    owConstant: "MinecraftJavaEdition",
    owGameName: "Minecraft: Java Edition",
    enable_for_app: true
  },
  {
    game: "Off The Grid",
    scalingFactor: 0.07000023333,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "osu!",
    scalingFactor: 0.0796,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Overwatch 2",
    scalingFactor: 0.00660000176,
    owGameId: "10844",
    owConstant: "Overwatch2",
    owGameName: "Overwatch 2",
    enable_for_app: false
  },
  {
    game: "Paladins",
    scalingFactor: 0.00915527343,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Palworld",
    scalingFactor: 0.0437455,
    owGameId: "23944",
    owConstant: "Palworld",
    owGameName: "Palworld",
    enable_for_app: false
  },
  {
    game: "PAYDAY 2",
    scalingFactor: 0.015,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "PUBG",
    scalingFactor: 1.0,
    specialConversion: true,
    conversionParams: { baseValue: 114.80, scaleFactor: 21.769 },
    owGameId: "10906",
    owConstant: "PUBG",
    owGameName: "PlayerUnknown's Battlegrounds",
    enable_for_app: true
  },
  {
    game: "Quake Champions",
    scalingFactor: 0.02199999511,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Rainbow Six Extraction",
    scalingFactor: 0.00572957914,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Rainbow Six Siege",
    scalingFactor: 0.00572957914,
    owGameId: "10826",
    owConstant: "RainbowSixSiege",
    owGameName: "Rainbow Six Siege",
    enable_for_app: false
  },
  {
    game: "Redmatch 2",
    scalingFactor: 0.05,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "REMATCH",
    scalingFactor: 0.11043,
    owGameId: "26120",
    owConstant: "REMATCH",
    owGameName: "REMATCH",
    enable_for_app: false
  },
  {
    game: "Roblox",
    scalingFactor: 0.39789557451,
    owGameId: "4688",
    owConstant: "Roblox",
    owGameName: "Roblox",
    enable_for_app: false
  },
  {
    game: "Rust",
    scalingFactor: 0.1125,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Spectre Divide",
    scalingFactor: 0.07152052639,
    owGameId: "24484",
    owConstant: "SpectreDivide",
    owGameName: "Spectre Divide",
    enable_for_app: false
  },
  {
    game: "Spellbreak",
    scalingFactor: 0.008,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Splitgate",
    scalingFactor: 0.0036574884,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Splitgate 2",
    scalingFactor: 0.01117268501,
    owGameId: "25884",
    owConstant: "Splitgate2",
    owGameName: "Splitgate 2",
    enable_for_app: false
  },
  {
    game: "STALKER 2",
    scalingFactor: 1.0,
    specialConversion: true,
    conversionParams: { linearCoefficient: 0.9, offset: 9.99998, constant: 428.571 },
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Strinova",
    scalingFactor: 0.01388194791,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Squad",
    scalingFactor: 0.17498152972,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Team Fortress 2",
    scalingFactor: 0.02199999511,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "THE FINALS",
    scalingFactor: 0.001,
    owGameId: "23478",
    owConstant: "THEFINALS",
    owGameName: "THE FINALS",
    enable_for_app: false
  },
  {
    game: "The First Descendant",
    scalingFactor: 1.0,
    specialConversion: true,
    conversionParams: { offset: 1.667, constant: 133.35 },
    owGameId: "24360",
    owConstant: "TheFirstDescendant",
    owGameName: "The First Descendant",
    enable_for_app: false
  },
  {
    game: "Titanfall 2",
    scalingFactor: 0.02199999511,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Unturned",
    scalingFactor: 0.5,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Valheim",
    scalingFactor: 0.05,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "Valorant",
    processName: "VALORANT-Win64-Shipping.exe",
    scalingFactor: 0.07,
    owGameId: "21640",
    owConstant: "Valorant",
    owGameName: "Valorant",
    enable_for_app: true
  },
  {
    game: "Warface",
    scalingFactor: 0.00332999963,
    owGameId: "0",
    enable_for_app: false
  },
  {
    game: "XDefiant",
    scalingFactor: 1.0,
    specialConversion: true,
    conversionParams: { linearCoefficient: 0.9, offset: 0.6780, constant: 527.1486 },
    owGameId: "22994",
    owConstant: "XDefiant",
    owGameName: "XDefiant",
    enable_for_app: false
  }
];