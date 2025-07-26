# PROJECT GUIDELINES

## DEVELOPMENT STANDARDS

- Prioritize simplicity and readability
- Use TypeScript strictly - avoid `any` types
- Refactor repeated functionality (DRY principle)
- Keep comments concise and focused on design concepts
- Don't add comments if it just repeats a function name
- Use functional and stateless approaches when possible
- Pathfinding logic must remain in `src/lib/pathfinding.ts` as pure functions
- Test changes: `npm run build` and `npm run type-check`
- Do no run `npm run dev` to test dev server

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
- `pathfinding.ts` - Complete pathfinding system (A*, BFS, target selection, distance calculations)
- `maps.ts` - Map configuration management

**State (`src/stores/`)**

- `grid.ts` - Reactive wrapper around Grid class
- `pathfinding.ts` - Minimal computed properties for pathfinding visualization

**Components (`src/components/`)**

- `GridManager.vue` - Centralized grid management and rendering coordination
- `GridTiles.vue` - Hex grid rendering with drag/drop
- `GridCharacters.vue` - Character overlay system
- `CharacterSelection.vue` - Character roster
- `DragDropProvider.vue` - Drag/drop context provider using provide/inject
- `DragPreview.vue` - Visual drag feedback
- `TabNavigation.vue` - Tab system for Characters/Artifacts/Map Editor
- `GridControls.vue` - Grid display toggles and action buttons

**Composables (`src/composables/`)**

- `useDragDrop.ts` - Global drag/drop state management
- `useGridEvents.ts` - Centralized event system with namespacing

**Utilities (`src/utils/`)**

- `dataLoader.ts` - Consolidated data loading for characters, artifacts, and assets

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

## PATHFINDING ARCHITECTURE

### Design Philosophy

The pathfinding system follows pure functional programming principles with framework-agnostic design:

- **Single Source of Truth**: All pathfinding logic consolidated in `src/lib/pathfinding.ts`
- **Pure Functions**: No side effects except module-level caching for performance
- **Framework Agnostic**: Zero Vue.js dependencies in core pathfinding logic
- **Clear Separation**: Grid class handles state, pathfinding module handles algorithms

### Core API

```typescript
// Core pathfinding algorithms
export function findPath(start: Hex, goal: Hex, getTile: Function, canTraverse: Function): Hex[] | null
export function calculateEffectiveDistance(...): DistanceResult
export function calculateRangedMovementDistance(...): RangedDistanceResult

// Target selection with comprehensive tie-breaking
export function findClosestTarget(...): TargetResult | null

// High-level game APIs
export function getClosestEnemyMap(tilesWithCharacters, characterRanges, gridPreset, cachingEnabled): Map<number, TargetInfo>
export function getClosestAllyMap(tilesWithCharacters, characterRanges, gridPreset, cachingEnabled): Map<number, TargetInfo>

// Utility functions
export function defaultCanTraverse(tile: GridTile): boolean
export function areHexesInSameRow(hexId1: number, hexId2: number, gridPreset): boolean
export function isVerticallyAligned(sourceHex: Hex, targetHex: Hex): boolean

// Cache management
export function clearPathfindingCache(): void
```

### Algorithm Selection

- **Ranged Units (range > 1)**: Uses BFS-based `calculateRangedMovementDistance()` to find minimum movement to engage ANY target
- **Melee Units (range = 1)**: Uses A*-based `calculateEffectiveDistance()` for individual target pathfinding

### Tie-Breaking Rules

Applied in exact order for consistent target selection:

1. **Vertical alignment priority**: Prefer targets in straight vertical lines (same q coordinate, no turns required)
2. **Same-row hex ID priority**: Within same row of grid preset, prefer lower hex ID
3. **Fallback hex ID priority**: For all other ties, prefer lower hex ID

### Usage Patterns

**Grid Operations:**
```typescript
// Grid class focuses purely on state management
grid.placeCharacter(hexOrId, characterId, team)
grid.removeCharacter(hexOrId)

// Pathfinding functions called separately with explicit parameters
const closestEnemies = getClosestEnemyMap(tiles, ranges, gridPreset, true)
```

**Store Integration:**
```typescript
// Stores use minimal computed properties that call pathfinding functions
const closestEnemyMap = computed(() => {
  const tilesWithCharacters = characterStore.getTilesWithCharacters()
  const characterRanges = new Map(gameDataStore.characterRanges)
  const grid = gridStore._getGrid()
  return getClosestEnemyMap(tilesWithCharacters, characterRanges, grid.gridPreset, true)
})
```

### Performance Optimizations

- **Module-level caching**: Separate cache instances for different calculation types
- **Lazy evaluation**: Computed properties only recalculate when dependencies change
- **Algorithm efficiency**: BFS for ranged movement, A* for precise pathfinding
- **Cache invalidation**: Automatic clearing when grid state changes

## DRAG AND DROP SYSTEM

### Architecture

Centralized drag/drop system using provide/inject pattern:

- **DragDropProvider**: Top-level provider component managing global drag/drop state
- **useDragDrop**: Composable for drag/drop state management
- **GridManager**: Registers hex detection and drop handling with provider
- **GridTiles**: SVG events + position-based mouse detection
- **Automatic team assignment**: Characters join teams based on drop tile

### Key Features

- Drag from character selection or grid characters
- Automatic team assignment based on target tile state
- Character swapping between occupied tiles
- Visual feedback with hover states
- Point-in-polygon detection for accurate hex targeting

### Implementation Notes

- **Provide/inject pattern**: DragDropProvider provides API to all child components
- **HTML overlays**: Enable dragging SVG elements
- **Position-based detection**: Handles blocked tile events
- **Unified visual feedback**: Uses `hoveredHexId` for consistent hover states
- **Custom MIME types**: Prevent drag conflicts between different drag sources

## EVENT SYSTEM

### Architecture

Centralized event system using composables and provide/inject:

- **useGridEvents**: Composable providing namespaced event system
- **Event namespacing**: Events like `hex:click`, `character:remove`, `artifact:remove`
- **Direct store integration**: Events handled directly in grid store where appropriate
- **Type-safe events**: Full TypeScript support for event parameters
- **Consistent patterns**: All game interactions (hex, character, artifact) use the same event system

### Usage Pattern

```typescript
import { useGridEvents } from '../composables/useGridEvents'

const events = useGridEvents()

// Emit events
events.emit('hex:click', hex)
events.emit('character:remove', hexId)
events.emit('artifact:remove', team)

// Listen to events (if needed for custom logic)
events.on('hex:hover', (hexId) => {
  // Custom hover handling
})
```

## COMPONENT ARCHITECTURE

### Separation of Concerns

- **Home.vue**: Layout and data initialization only (~170 lines, down from 500+)
- **GridManager.vue**: Grid rendering coordination and drag/drop registration
- **DragDropProvider.vue**: Global drag/drop state management
- **Store integration**: Business logic centralized in Pinia stores
- **Modular design**: Each component has single, focused responsibility

## DEVELOPMENT WORKFLOW

### Layer Guidelines

- Core logic → `src/lib/` (pathfinding, grid, hex, layout)
- State management → `src/stores/` (minimal computed properties only)
- UI components → `src/components/`
- Utilities → `src/utils/`

**Important**: All pathfinding logic must remain consolidated in `src/lib/pathfinding.ts` as pure functions. Stores should only contain computed properties that call these functions.

### Validation

1. `npm run build` - Check for build errors
2. `npm run type-check` - Verify TypeScript compliance
3. Test in development mode
4. Update documentation if needed

## MAP EDITOR SYSTEM

### Architecture

New map editing functionality allows users to paint hex states directly on the grid:

- **MapEditor Component**: State selection UI with visual previews and clear map functionality
- **Click-to-Paint**: Single-click hex state changes when map editor mode is active
- **Drag-to-Paint**: Hold and drag mouse to paint multiple hexes continuously
- **Complete Reset**: Painting over any tile removes characters and replaces the state entirely
- **Performance**: Throttled updates (50ms) to prevent lag during drag operations

### Key Components

```typescript
// MapEditor.vue - State selection UI
emit('stateSelected', state)    // When user selects a state to paint with
emit('clearMap')               // When user clicks "Clear Map" button

// GridManager.vue - Integration layer
isMapEditorMode: boolean       // Enable map editor functionality
selectedMapEditorState: State // Current painting state

// GridTiles.vue - Drag-to-paint implementation
handleMapEditorMouseDown()     // Start drag-to-paint session
handleMapEditorMouseUp()       // End drag-to-paint session
```

### Grid Store Methods

```typescript
// Map editor methods in grid store
setHexState(hexId, state)      // Paint single hex (removes characters, resets tile)
clearAllHexStates()           // Reset all hexes to DEFAULT (removes all characters)
```

### Usage Flow

1. User selects 'Map Editor' tab → `activeTab = 'mapEditor'`
2. User clicks state button → `selectedMapEditorState` updates
3. User clicks/drags on grid → `setHexState()` called for each hex
4. Any existing characters are removed and tile is reset to selected state

## COMMON PATTERNS

### Data Loading

All data loading is handled by the consolidated `dataLoader` utility:

```typescript
import {
  loadCharacters,
  loadArtifacts,
  loadCharacterImages,
  loadAllData,
} from '../utils/dataLoader'

// Load specific data types
const characters = loadCharacters()
const images = loadCharacterImages()

// Load everything at once (used in store initialization)
const allData = loadAllData()
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

### Pathfinding Operations

```typescript
import { getClosestEnemyMap, getClosestAllyMap, findClosestTarget } from '../lib/pathfinding'

// Get closest targets for all characters
const enemyMap = getClosestEnemyMap(tilesWithCharacters, characterRanges, gridPreset, true)
const allyMap = getClosestAllyMap(tilesWithCharacters, characterRanges, gridPreset, true)

// Find closest target for specific character
const result = findClosestTarget(sourceTile, targetTiles, range, getTile, canTraverse, gridPreset, true)
```

### State Formatting

```typescript
import { getHexFillColor } from '../utils/stateFormatting'
const fillColor = getHexFillColor(state)
```

### Tab System

The application uses a centralized tab navigation system:

```typescript
// Tab state management in Home.vue
const activeTab = ref('characters') // 'characters' | 'artifacts' | 'mapEditor'

const handleTabChange = (tab: string) => {
  activeTab.value = tab
}
```

**Available tabs:**

- **Characters**: Character selection and placement
- **Artifacts**: Artifact management
- **Map Editor**: Map editing functionality (placeholder for future implementation)

### Action Buttons

GridControls provides action buttons for various operations:

```typescript
// Grid export functionality using html-to-image
const handleDownload = async () => {
  const { toPng } = await import('html-to-image')
  const mapElement = document.getElementById('map')
  const dataUrl = await toPng(mapElement, {
    quality: 1.0,
    pixelRatio: 2,
    backgroundColor: 'transparent',
  })
  // Create and trigger download
}

// Copy grid image to clipboard
const handleCopyImage = async () => {
  const { toPng } = await import('html-to-image')
  const mapElement = document.getElementById('map')
  const dataUrl = await toPng(mapElement, {
    /* same options */
  })
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
}

// Placeholder handlers for future implementation
const handleCopyLink = () => {
  /* TODO */
}
```

**Grid Export Features:**

**Download:**

- Downloads the entire grid (everything inside `id="map"`) as a PNG image
- Uses `html-to-image` library for high-quality export
- Transparent background for easy compositing
- Includes characters, tiles, arrows, and all visual elements
- Filename format: `stargazer-YYYYMMDD-HHMMSSMMM.png`
- Features download arrow icon for clear visual indication

**Copy to Clipboard:**

- Generates the same high-quality PNG image
- Copies directly to system clipboard using Clipboard API
- Works in modern browsers that support `navigator.clipboard.write()`
- Users can paste the image into other applications (Discord, Slack, documents, etc.)
- Graceful fallback with console warning for unsupported browsers
- Features clipboard icon for intuitive UX

## BUILD COMMANDS

- `npm run dev` - Development server
- `npm run build` - Production build
- `npm run type-check` - TypeScript validation
- `npm run format` - Code formatting
