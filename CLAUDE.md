# CHIPPY PROJECT GUIDELINES

## BEST PRACTICES

### DEVELOPMENT STANDARDS

When writing code, adhere to these general principles:

- Prioritize simplicity and readability over clever solutions
- Refactor when functionalities are repeated for three or more times to enforce DRY principle
- When possible, use functional and stateless approaches if they help improve clarity
- Keep core logic clean and push implementation details to the edges
- Maintain consistent style (indentation, naming, patterns) throughout the codebase
- Balance file organization with simplicity - use an appropriate number of files for the project scale
- Write comments to document complex functionality, large functions should have block comments before the function documenting its intended purpose

### CODE QUALITY

- Use TypeScript strictly - prefer explicit types over `any`
- Create reusable components and utilities when patterns emerge
- Test changes by running `npm run build` and `npm run type-check`
- Follow existing naming conventions (camelCase for variables/functions, PascalCase for components/classes)
- Use `npm run format` to format generated code

## ARCHITECTURE

### CORE STRUCTURE

The project follows a layered architecture with clear separation of concerns:

```
src/
├── lib/           # Framework-agnostic core logic
├── stores/        # Reactive state management (Pinia)
├── components/    # Vue.js UI components
├── utils/         # Shared utilities
├── data/          # Static data files
└── assets/        # Images and other assets
```

### LAYER RESPONSIBILITIES

**Core Logic Layer (`src/lib/`)**

- Contains framework-agnostic hex grid and layout implementations
- All logic related to hex tiles, grid states, and game mechanics should live here
- Implementation should be modular and portable to other frameworks if needed
- Key files:
  - `hex.ts` - Hex coordinate system and basic operations
  - `grid.ts` - Grid management, character placement, team restrictions
  - `layout.ts` - Hex-to-pixel conversions and rendering calculations
  - `constants.ts` - State enumerations and grid presets

**State Management Layer (`src/stores/`)**

- `grid.ts` - Pinia store acting as a thin reactive wrapper around the Grid instance
- Provides the interface between Vue.js components and the core game state
- Handles reactivity triggers for UI updates
- Should not contain game logic - only state management and UI integration

**UI Layer (`src/components/`)**

- Vue.js components for rendering and user interaction
- Should use store methods rather than directly calling core logic
- Key components:
  - `GridTiles.vue` - Main hex grid rendering
  - `GridCharacters.vue` - Character overlay system
  - `GridArrow.vue` - Arrow drawing between hexes
  - `CharacterSelection.vue` - Character roster with team selection
  - `Character.vue` - Individual character display
  - `DebugGrid.vue` - Development debugging interface

**Utilities Layer (`src/utils/`)**

- Shared helper functions and utilities
- `stateFormatting.ts` - Centralized state display formatting
- `assetLoader.ts` - Asset loading helpers with filename extraction

### DATA MANAGEMENT

**Character Data**

- Character definitions stored in `src/data/character/*.json`
- Character images in `src/assets/images/character/*.png`
- Use `loadAssetsDict()` utility for consistent asset loading patterns

**Icons and Assets**

- Game icons in `src/assets/images/icons/*.png`
- Use the same asset loading patterns for consistency

## API DESIGN PRINCIPLES

### Grid Class Methods

The Grid class uses unified methods that accept both `Hex` objects and `number` IDs:

```typescript
// ✅ Good - Unified API
grid.placeCharacter(hexOrId, characterId, team)
grid.getCharacter(hexOrId)
grid.removeCharacter(hexOrId)

// ❌ Avoid - Don't create separate *ById methods
grid.placeCharacterById(hexId, characterId, team) // Removed
grid.getCharacterById(hexId) // Removed
```

### State Management

- Use computed properties for reactive data that depends on game state
- Trigger reactivity with `characterUpdateTrigger.value++` when game state changes
- Expose minimal, focused API from stores to components

### Component Props and Events

- Use TypeScript interfaces for complex prop types
- Prefer composition over inheritance for component reuse
- Follow Vue.js best practices for event handling and prop validation

### Vue Single File Component Structure

- **Order**: Always structure Vue SFCs in this order:
  1. `<script setup lang="ts">` - Component logic and imports
  2. `<template>` - Component markup
  3. `<style scoped>` - Component styles
- This consistent ordering improves readability and follows Vue.js conventions

## DEVELOPMENT WORKFLOW

### Before Making Changes

1. Understand the current architecture and layer responsibilities
2. Check if similar functionality already exists to avoid duplication
3. Consider which layer your changes belong to

### Making Changes

1. Core game logic → Update `src/lib/` files
2. State management → Update `src/stores/grid.ts`
3. UI changes → Update Vue components
4. Shared utilities → Add to `src/utils/`

### After Making Changes

1. Run `npm run build` to verify no build errors
2. Run `npm run type-check` to verify TypeScript compliance
3. Test functionality in development mode
4. Update this documentation if architecture changes

## COMMON PATTERNS

### Asset Loading

Use the standardized asset loading pattern:

```typescript
import { loadAssetsDict } from '../utils/assetLoader'

const images = loadAssetsDict(
  import.meta.glob('../assets/images/*.png', {
    eager: true,
    import: 'default',
  }) as Record<string, string>,
)
```

### State Formatting

Use the centralized state formatting utilities:

```typescript
import { getStateName, getStateClass, getHexFillColor } from '../utils/stateFormatting'

const displayName = getStateName(state)
const cssClass = getStateClass(state)
const fillColor = getHexFillColor(state)
```

### Grid Operations

Access the grid through the store for reactive updates:

```typescript
const gridStore = useGridStore()

// Place character
gridStore.placeCharacterOnHex(hexId, characterId, team)

// Get character
const character = gridStore.getCharacterOnHex(hexId)

// Check occupancy
const isOccupied = gridStore.isHexOccupied(hexId)
```

## TESTING AND VALIDATION

### Build Commands

- `npm run build` - Full production build with type checking
- `npm run type-check` - TypeScript type validation only
- `npm run dev` - Development server with hot reload

### Code Quality Checks

- Ensure all TypeScript strict mode compliance
- Verify no console errors in browser
- Test character placement and grid interactions
- Validate state transitions and team restrictions

---

_This documentation should be updated when architectural changes are made to keep it current with the codebase._
