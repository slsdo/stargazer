# Stargazer

AFK Journey arena simulator built with Vue 3 and TypeScript. Place characters on hex grids and experiment with team compositions using pathfinding and targeting mechanics.

## Features

- Interactive hex grid with drag & drop character placement
- Range-aware pathfinding and targeting arrows
- Multiple arena maps with different layouts
- Team composition experimentation
- Character data with factions, classes, and abilities

## Prerequisites

- **Node.js** 18+ - [Download here](https://nodejs.org/)
- **Git** - [Download here](https://git-scm.com/)

## Getting Started

```bash
# Clone and setup
git clone <repository-url>
cd stargazer
npm install

# Start development server
npm run dev
```

Open http://localhost:5173 in your browser.

## Commands

```bash
npm run dev         # Development server
npm run build       # Production build
npm run type-check  # TypeScript validation
npm run format      # Code formatting
```

## Project Structure

```
src/
├── lib/            # Core game logic (hex grid, pathfinding)
├── stores/         # State management (Pinia)
├── components/     # Vue components
├── views/          # Page components
├── data/           # Character and other in-game JSON data
└── assets/         # Images and media
```

## Development

See `CLAUDE.md` for detailed technical documentation and architecture guidelines.

_Built with the help of Claude Code - because even AFK journeys need a good AI pair programmer! 🤖⚔️_
