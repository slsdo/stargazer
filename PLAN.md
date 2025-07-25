# Selection Components Refactoring Plan

## Overview

This plan outlines the refactoring of CharacterSelection and ArtifactSelection components to eliminate code duplication while maintaining each component's unique styling. Based on analysis, these components share approximately 80% of their logic and structure.

## Current Duplication Analysis

### Shared Patterns
- **Team selection logic**: Both components use identical team state management
- **Clear all functionality**: Same implementation across both components
- **Controls row structure**: Identical layout with TeamToggle and ClearButton
- **Grid store usage**: Both use characterStore and artifactStore
- **Template structure**: Nearly identical layout patterns

### Unique Aspects to Preserve
- **CSS styling**: Each component maintains its own styling (per requirement)
- **Item click handling**: Different logic for characters vs artifacts
- **Placement checking**: Different methods for determining if items are placed
- **Props structure**: Slightly different prop requirements

## Proposed Solution

### 1. Create `useSelectionState` Composable

**Location**: `/src/composables/useSelectionState.ts`

**Purpose**: Extract common team selection and store management logic

**Features**:
```typescript
export function useSelectionState() {
  const selectedTeam = ref<Team>(Team.ALLY)
  const characterStore = useCharacterStore()
  const artifactStore = useArtifactStore()
  
  const handleTeamChange = (team: Team) => {
    selectedTeam.value = team
  }
  
  const handleClearAll = () => {
    characterStore.clearAllCharacters()
    artifactStore.clearAllArtifacts()
  }
  
  return {
    selectedTeam,
    characterStore,
    artifactStore,
    handleTeamChange,
    handleClearAll
  }
}
```

### 2. Create `BaseSelection` Component

**Location**: `/src/components/BaseSelection.vue`

**Purpose**: Generic selection container that handles common layout and controls

**Features**:
- Renders controls row with TeamToggle and ClearButton
- Provides slot for custom item rendering
- Handles team selection state via composable
- Minimal styling (just structure, no visual styling)

**Template Structure**:
```vue
<template>
  <div :class="containerClass">
    <div class="controls-row">
      <TeamToggle
        :selectedTeam="selectedTeam"
        :showCounts="showCounts"
        :allyCount="allyCount"
        :enemyCount="enemyCount"
        :maxCount="maxCount"
        @team-change="handleTeamChange"
      />
      <ClearButton @click="handleClearAll" />
    </div>
    
    <slot
      :selectedTeam="selectedTeam"
      :characterStore="characterStore"
      :artifactStore="artifactStore"
    />
  </div>
</template>
```

### 3. Refactor CharacterSelection

**Changes**:
- Use `useSelectionState` composable
- Use `BaseSelection` component
- Keep all character-specific logic and styling
- Maintain drag functionality

**New Structure**:
```vue
<script setup lang="ts">
import BaseSelection from './BaseSelection.vue'
import Character from './Character.vue'
import { useSelectionState } from '../composables/useSelectionState'
// ... other imports

const { selectedTeam, characterStore } = useSelectionState()

// Keep character-specific methods
const isCharacterPlaced = (characterId: string): boolean => { ... }
const handleCharacterClick = (character: CharacterType) => { ... }
const removeCharacterFromGrid = (characterId: string) => { ... }
</script>

<template>
  <BaseSelection
    containerClass="character-selection"
    :showCounts="true"
    :allyCount="characterStore.availableAlly"
    :enemyCount="characterStore.availableEnemy"
    :maxCount="5"
  >
    <div class="characters">
      <Character
        v-for="character in characters"
        :key="character.id"
        :character="{ ...character, team: selectedTeam }"
        :characterImage="characterImages[character.id]"
        :icons="icons"
        :isDraggable="isDraggable"
        :isPlaced="isCharacterPlaced(character.id)"
        @character-click="handleCharacterClick"
      />
    </div>
  </BaseSelection>
</template>

<style scoped>
/* Keep all existing styles */
</style>
```

### 4. Refactor ArtifactSelection

**Changes**:
- Use `useSelectionState` composable
- Use `BaseSelection` component
- Keep all artifact-specific logic and styling

**New Structure**:
```vue
<script setup lang="ts">
import BaseSelection from './BaseSelection.vue'
import Artifact from './Artifact.vue'
import { useSelectionState } from '../composables/useSelectionState'
// ... other imports

const { selectedTeam, artifactStore } = useSelectionState()

// Keep artifact-specific methods
const handleArtifactClick = (artifact: ArtifactType) => { ... }
const isArtifactPlaced = (artifactId: string): boolean => { ... }
</script>

<template>
  <BaseSelection
    containerClass="artifact-selection"
    :showCounts="false"
  >
    <div class="artifacts">
      <div v-for="artifact in artifacts" :key="artifact.id" class="artifact-profile">
        <Artifact
          :artifact="artifact"
          :artifactImage="artifactImages[artifact.id]"
          :isPlaced="isArtifactPlaced(artifact.id)"
          @artifact-click="handleArtifactClick"
        />
      </div>
    </div>
  </BaseSelection>
</template>

<style scoped>
/* Keep all existing styles */
</style>
```

## Implementation Steps

### Phase 1: Create Shared Infrastructure
1. Create `useSelectionState.ts` composable with shared logic
2. Test composable in isolation

### Phase 2: Create Base Component
3. Create `BaseSelection.vue` component with minimal structure
4. Ensure TypeScript types are properly defined

### Phase 3: Refactor Existing Components
5. Refactor `CharacterSelection.vue` to use new infrastructure
6. Test character selection functionality thoroughly
7. Refactor `ArtifactSelection.vue` to use new infrastructure
8. Test artifact selection functionality thoroughly

### Phase 4: Validation
9. Run `npm run build` to check for build errors
10. Run `npm run type-check` to verify TypeScript compliance
11. Test all functionality:
    - Team switching
    - Character placement/removal
    - Artifact placement/removal
    - Clear all functionality
    - Drag and drop (for characters)

## Benefits

### Code Reduction
- Eliminate ~40 lines of duplicate script logic
- Remove duplicate team management code
- Consolidate clear all functionality
- Single source of truth for selection patterns

### Maintainability
- Changes to team selection logic only need to be made once
- Clear separation between shared and unique functionality
- Easier to add new selection components in the future

### Architecture Alignment
- Follows project's composable-first approach
- Maintains component-specific styling (as requested)
- Preserves TypeScript type safety
- Respects existing layered architecture

## What We're NOT Doing

Per the requirement, we are **NOT**:
- Extracting shared CSS into a common stylesheet
- Creating shared style utilities
- Modifying the visual appearance of either component
- Changing the individual Character.vue or Artifact.vue components

Each component will maintain its own unique styling to preserve visual differences and allow independent style evolution.

## Risk Assessment

### Low Risk
- No breaking changes to functionality
- Incremental refactoring approach
- TypeScript will catch integration issues
- Existing behavior is preserved

### Testing Requirements
- Verify team switching works correctly
- Test character auto-placement
- Confirm artifact placement/removal
- Ensure drag-and-drop still functions
- Validate clear all affects both stores

## Future Considerations

This refactoring creates a foundation for:
- Additional selection components (e.g., presets, maps)
- Enhanced filtering capabilities
- Unified keyboard navigation
- Consistent behavior patterns across all selections

While keeping styling separate as requested, the shared logic infrastructure will make future development more efficient.