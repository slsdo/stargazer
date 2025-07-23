# Stargazer Refactoring Plan

## Overview

This document outlines a comprehensive refactoring plan to improve the component architecture of the Stargazer project. The primary goal is to decompose the `Home.vue` "god component" into smaller, focused components with clear responsibilities.

## Current Issues

### 1. Home.vue as a God Component
The `Home.vue` component currently handles:
- Grid rendering and interaction logic
- Hex detection algorithms (point-in-polygon)
- Drag and drop orchestration for grid characters
- Character and artifact data loading
- Tab navigation and UI state
- Global event listeners
- Complex event handling for multiple interaction types

### 2. Architectural Problems
- **Violation of Single Responsibility Principle**: Components handle multiple unrelated concerns
- **Tight Coupling**: Direct dependencies between Home.vue, GridTiles, and drag/drop logic
- **Event Handling Complexity**: Multiple overlapping event systems
- **Data Loading at View Level**: JSON and asset loading mixed with UI logic
- **Scattered Drag/Drop Logic**: Implementation spread across multiple components

## Proposed Architecture

### Component Hierarchy
```
Home.vue (Simple Layout Component)
├── GridManager.vue (Grid Container)
│   ├── GridTiles.vue
│   ├── GridCharacters.vue
│   ├── GridArrows.vue
│   ├── GridArtifacts.vue
│   └── CharacterDragOverlay.vue
├── TabNavigation.vue
│   ├── CharacterSelection.vue
│   └── ArtifactSelection.vue
└── GridControls.vue
```

## Refactoring Phases

### Phase 1: Extract GridManager Component

**Goal**: Create a dedicated component to handle all grid-related logic and rendering.

**Tasks**:
1. Create `GridManager.vue` component
2. Move the entire `<div id="map">` block from Home.vue
3. Extract hex detection logic (`findHexUnderMouse`, `isPointInPolygon`)
4. Move grid-specific event handlers
5. Extract HTML overlay system for character dragging
6. Consolidate all grid interaction logic

**New Component Responsibilities**:
- Grid rendering orchestration
- Position-based hex detection
- Grid character drag/drop handling
- Event coordination for grid interactions
- Visual state management (arrows, hex IDs)

**Benefits**:
- Home.vue becomes a simple layout component
- All grid logic is encapsulated
- Easier to test grid functionality in isolation

### Phase 2: Create DragDropProvider Component

**Goal**: Centralize all drag and drop logic into a provider component.

**Tasks**:
1. Create `DragDropProvider.vue` component
2. Move global drag/drop event listeners
3. Implement provide/inject pattern for drag state
4. Create unified drag/drop API
5. Extract drop validation logic
6. Consolidate position tracking

**New Component Structure**:
```vue
<DragDropProvider>
  <GridManager />
  <TabNavigation />
</DragDropProvider>
```

**Benefits**:
- Cleaner drag/drop API
- Centralized event handling
- Reduced complexity in child components
- Better separation of concerns

### Phase 3: Extract Data Layer

**Goal**: Move data loading and management out of components.

**Tasks**:
1. Create a single `DataManager` service to handle all data loading:
   - Character data loading
   - Artifact data loading
   - Asset loading (images, icons)
2. Move JSON loading logic to DataManager
3. Initialize data in store actions using DataManager
4. Create data provider components if needed
5. Remove data loading from Home.vue

**Benefits**:
- Components focus on presentation
- Data loading is centralized in one service
- Easier to mock for testing
- Better performance with data caching
- Single point of entry for all data operations

### Phase 4: Simplify Event System

**Goal**: Create a cleaner event handling pattern.

**Tasks**:
1. Create event composable or bus
2. Consolidate similar events
3. Implement event namespacing
4. Remove redundant event handlers
5. Use provide/inject for grid events

**Event Categories**:
- Grid interactions (hex clicks, character clicks)
- Drag/drop events
- UI state changes
- Data updates

**Benefits**:
- Reduced event handling complexity
- Clearer event flow
- Easier debugging
- Better performance

## Implementation Details

### GridManager Component Structure

```vue
<!-- GridManager.vue -->
<template>
  <div class="grid-manager">
    <div class="grid-container" ref="gridContainer">
      <!-- Arrow Layer -->
      <svg v-if="showArrows" class="arrow-layer">
        <GridArrow v-for="arrow in arrows" ... />
      </svg>
      
      <!-- Grid Layer -->
      <GridTiles
        :hexes="hexes"
        @hex-click="handleHexClick"
      >
        <GridCharacters ... />
      </GridTiles>
      
      <!-- Drag Overlay -->
      <CharacterDragOverlay
        v-if="hasCharacters"
        :placements="characterPlacements"
        @drag-start="handleCharacterDragStart"
      />
      
      <!-- Artifacts -->
      <GridArtifacts ... />
    </div>
  </div>
</template>

<script setup>
// Props for configuration
const props = defineProps({
  showArrows: Boolean,
  showHexIds: Boolean,
  // ... other display options
})

// Hex detection logic
const findHexUnderMouse = (x, y) => {
  // ... point-in-polygon detection
}

// Grid-specific event handling
const handleHexClick = (hex) => {
  // ... handle hex interactions
}

// Expose methods for parent
defineExpose({
  findHexUnderMouse,
  // ... other public methods
})
</script>
```

### DragDropProvider Pattern

```vue
<!-- DragDropProvider.vue -->
<template>
  <div class="drag-drop-provider" 
       @dragover="handleDragOver"
       @drop="handleDrop">
    <slot />
  </div>
</template>

<script setup>
import { provide } from 'vue'

// Drag state management
const dragState = reactive({
  isDragging: false,
  draggedItem: null,
  hoveredHex: null,
})

// Provide drag/drop API to children
provide('dragDrop', {
  startDrag,
  endDrag,
  setHoveredHex,
  // ... other methods
})

// Centralized event handling
const handleDragOver = (event) => {
  // ... unified drag over logic
}
</script>
```

## Testing Strategy

Each refactored component should have:
1. Unit tests for isolated logic
2. Integration tests for component interactions
3. E2E tests for critical user flows

## Migration Path

1. **Incremental Refactoring**: Each phase can be completed independently
2. **Feature Flags**: Use flags to toggle between old and new implementations
3. **Backward Compatibility**: Maintain existing APIs during transition
4. **Gradual Rollout**: Test each phase thoroughly before proceeding

## Success Metrics

- **Code Metrics**:
  - Reduced lines of code in Home.vue (target: <100 lines)
  - Increased component cohesion
  - Decreased coupling between components

- **Developer Experience**:
  - Easier to understand component responsibilities
  - Faster development of new features
  - Simpler debugging and testing

- **Performance**:
  - Reduced re-renders
  - Better event handling efficiency
  - Improved drag/drop responsiveness

## Next Steps

1. Review and approve this plan
2. Create feature branch for Phase 1
3. Implement GridManager component
4. Test thoroughly
5. Proceed to subsequent phases

## Notes

- Each phase should be completed and tested before moving to the next
- Consider creating a temporary feature flag to switch between old and new implementations
- Ensure all existing functionality is preserved during refactoring
- Update tests as components are refactored
- Document any API changes for other developers