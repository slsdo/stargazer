# PROJECT GUIDELINES

## DEVELOPMENT STANDARDS

- Prioritize simplicity and readability
- Use TypeScript strictly - avoid `any` types
- Refactor repeated functionality (DRY principle)
- Keep comments concise and focused on design concepts
- Don't add comments if it just repeats a function name
- Use functional and stateless approaches when possible
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
- `pathfinding.ts` - A\* pathfinding algorithms
- `maps.ts` - Map configuration management

**State (`src/stores/`)**

- `grid.ts` - Reactive wrapper around Grid class

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
