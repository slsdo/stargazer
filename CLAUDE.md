# PROJECT GUIDELINES

## DEVELOPMENT STANDARDS

- Prioritize simplicity and readability
- Use TypeScript strictly - avoid `any` types
- Refactor repeated functionality (DRY principle)
- Keep comments concise and focused on design concepts
- Test changes: `npm run build` and `npm run type-check`
- Use `npm run format` to format code

## ARCHITECTURE

Layered architecture with clear separation of concerns:

```
src/
├── lib/              # Framework-agnostic game logic
│   ├── types/        # TypeScript type definitions
│   └── arena/        # Map configurations
├── stores/           # Pinia state management
├── components/       # Vue.js UI components
├── composables/      # Vue composition functions
├── utils/            # Shared utilities
├── views/            # Page components
├── data/             # Static JSON data
└── assets/           # Images and assets
```

### KEY FILES

**Core Logic (`src/lib/`)**
- `hex.ts` - Hex coordinate system
- `grid.ts` - Grid management and character placement
- `layout.ts` - Hex-to-pixel conversions
- `pathfinding.ts` - A* pathfinding algorithms
- `maps.ts` - Map configuration management

**State (`src/stores/`)**
- `grid.ts` - Reactive wrapper around Grid class

**Components (`src/components/`)**
- `GridTiles.vue` - Hex grid rendering with drag/drop
- `GridCharacters.vue` - Character overlay system
- `CharacterSelection.vue` - Character roster
- `DragPreview.vue` - Visual drag feedback

**Composables (`src/composables/`)**
- `useDragDrop.ts` - Global drag/drop state management

## DESIGN PRINCIPLES

### Grid API
Grid methods accept both `Hex` objects and hex IDs:
```typescript
grid.placeCharacter(hexOrId, characterId, team)
grid.getCharacter(hexOrId)
grid.removeCharacter(hexOrId)
```

### State Management
- Use computed properties for reactive data
- Trigger reactivity: `characterUpdateTrigger.value++`
- Store methods should be minimal and focused

### Vue Components
- Structure: `<script setup>`, `<template>`, `<style scoped>`
- Use TypeScript interfaces for complex props
- Prefer composition over inheritance

## DRAG AND DROP SYSTEM

### Architecture
Hybrid detection system supporting multiple drag sources:

- **useDragDrop**: Global state management for all drag operations
- **GridTiles**: SVG events + position-based mouse detection
- **Home**: HTML overlay system for grid character dragging
- **Automatic team assignment**: Characters join teams based on drop tile

### Key Features
- Drag from character selection or grid characters
- Automatic team assignment based on target tile state
- Character swapping between occupied tiles
- Visual feedback with hover states
- Point-in-polygon detection for accurate hex targeting

### Implementation Notes
- HTML overlays enable dragging SVG elements
- Position-based detection handles blocked tile events
- Uses `hoveredHexId` for unified visual feedback
- Custom MIME types prevent drag conflicts

## DEVELOPMENT WORKFLOW

### Layer Guidelines
- Core logic → `src/lib/`
- State management → `src/stores/`
- UI components → `src/components/`
- Utilities → `src/utils/`

### Validation
1. `npm run build` - Check for build errors
2. `npm run type-check` - Verify TypeScript compliance
3. Test in development mode
4. Update documentation if needed

## COMMON PATTERNS

### Asset Loading
```typescript
import { loadAssetsDict } from '../utils/assetLoader'

const images = loadAssetsDict(
  import.meta.glob('../assets/images/*.png', {
    eager: true,
    import: 'default',
  }) as Record<string, string>,
)
```

### Grid Operations
```typescript
const gridStore = useGridStore()

// Character placement
gridStore.placeCharacterOnHex(hexId, characterId, team)
gridStore.moveCharacter(fromHexId, toHexId, characterId)
gridStore.swapCharacters(fromHexId, toHexId)

// State queries
const character = gridStore.getCharacterOnHex(hexId)
const isOccupied = gridStore.isHexOccupied(hexId)
```

### State Formatting
```typescript
import { getHexFillColor } from '../utils/stateFormatting'
const fillColor = getHexFillColor(state)
```

## BUILD COMMANDS

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run type-check` - TypeScript validation
- `npm run format` - Code formatting
