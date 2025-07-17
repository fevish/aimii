# aimii

AIMII is a complete overwolf-electron mouse sensitivity converter application with real-time game detection, event-driven architecture, and both main window and overlay widget interfaces. The app is optimized for maximum performance with minimal latency.

## Features

- **Real-time Game Detection**: Automatically detects when you're playing supported games
- **Cross-Game Sensitivity Conversion**: Convert your sensitivity settings between different games
- **Overlay Widget**: In-game overlay showing current sensitivity suggestions
- **Canonical Settings**: Set your preferred game and sensitivity as a baseline for conversions
- **Hotkey Support**: Toggle widget visibility with customizable hotkeys
- **Dark Theme**: Modern, clean interface with glassmorphism effects

## Supported Games

The app supports a wide range of popular games including:
- Counter-Strike 2
- Valorant
- Apex Legends
- Overwatch 2
- Rainbow Six Siege
- And many more...

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd aimii
```

2. Install dependencies:
```bash
npm install
```

### Development Mode

For development with hot reloading:

```bash
# Start the development build with hot reloading
npm run watch

# Or run individual watch processes
npm run dev
```

### Production Build

To build the app for production:

```bash
# Build the application
npm run build

# Build the installer
npm run build:ow-electron
```

### Running the App

After building, you can run the app:

```bash
# Run the built application
npm run start

# Or run directly with ow-electron
npm run build:start
```

## Development

### Project Structure

```
src/
├── browser/
│   ├── services/          # Core business logic
│   │   ├── current-game.service.ts      # Game detection
│   │   ├── gep.service.ts               # Game events provider
│   │   ├── overlay.service.ts           # Overlay API management
│   │   ├── sensitivity-converter.service.ts # Cross-game calculations
│   │   ├── games.service.ts             # Game configuration
│   │   └── settings.service.ts          # Settings storage
│   ├── controllers/       # IPC and window management
│   │   ├── main-window.controller.ts    # Main window coordination
│   │   └── widget-window.controller.ts  # Overlay widget management
│   └── index.ts          # Dependency injection setup
├── components/
│   ├── MyMainWindow/     # Main application UI
│   └── Widget/           # Overlay widget UI
├── preload/              # Context bridge APIs
└── games.json           # Game configuration data
```

### Key Features

#### Event-Driven Architecture
- Pure event-driven game detection using Overwolf events (no polling)
- GEP-Overlay coordination for immediate injection attempts
- IPC events for instant UI refresh
- Smart state updates prevent unnecessary re-renders

#### Performance Optimizations
- O(1) game ID lookups using Set instead of array.includes
- Automatic feature setting on game detection
- Consolidated data loading with Promise.all
- React memoization for expensive calculations
- Debounced operations to prevent excessive calls

#### Game Detection System
- **GEP Detection**: Primary detection using `gameInfo.classId` with O(1) Set lookups
- **Overlay Detection**: Secondary method with automatic injection for supported games
- **Fallback System**: If overlay fails, GEP provides detection
- **Immediate Injection**: GEP detection triggers overlay injection attempts immediately

### Hotkeys

- **Ctrl+Shift+M**: Toggle widget visibility
- **Ctrl+Shift+I**: Open widget developer tools (development mode)

### Configuration

Game configurations are stored in `src/data/games.json`. Each game entry includes:
- Conversion factors for sensitivity calculations
- Overwolf game IDs
- Game-specific constants and formulas

## Building for Distribution

The app uses electron-builder with Overwolf integration:

```bash
# Build the application
npm run build

# Create installer
npm run build:ow-electron
```

The installer will be created in the `build` directory.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

Join our Discord community for support and updates: [Discord Server](https://discord.gg/Nj2Xj3W4eY)