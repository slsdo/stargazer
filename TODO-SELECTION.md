# Selection Components Refactoring Plan

## Overview

Analysis of Character and Artifact selection components reveals significant code duplication that can be consolidated into shared components and composables. This refactoring would eliminate ~150+ lines of duplicate code while improving maintainability and consistency.

## Current Duplicate Code Patterns

### 1. **Template Structure Duplication (100% Identical)**

Both `CharacterSelection.vue` and `ArtifactSelection.vue` share identical template structures:

```vue
<template>
  <div class="[component]-selection">
    <!-- Controls Row -->
    <div class="controls-row">
      <TeamToggle
        :selectedTeam="selectedTeam"
        :showCounts="[varies]"
        @team-change="handleTeamChange"
      />
      <ClearButton @click="handleClearAll" />
    </div>

    <!-- Items Grid -->
    <div class="[items]">
      <!-- Item rendering loop -->
    </div>
  </div>
</template>
```

### 2. **Script Logic Duplication (~80% Duplicate)**

**Common Script Patterns:**
```typescript
// Both components have identical team management
const selectedTeam = ref<Team>(Team.ALLY)
const handleTeamChange = (team: Team) => {
  selectedTeam.value = team
}

// Identical clear all logic
const handleClearAll = () => {
  gridStore.clearAllCharacters()
  gridStore.clearAllArtifacts()
}

// Similar grid store usage
const gridStore = useGridStore()
```

### 3. **CSS Styling Duplication (~90% Identical)**

**Identical CSS Classes:**
```css
.{component}-selection {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
}

.{items} {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xl);
  padding: var(--spacing-lg);
  background-color: var(--color-bg-light-gray);
  border-radius: var(--radius-large);
  max-height: 70vh;
  overflow-y: auto;
}
```

### 4. **Individual Item Components (~70% Similar)**

**Character.vue vs Artifact.vue Similarities:**
- Circular/rounded display containers
- Similar sizing patterns (70px vs 50px)
- Placement state styling (`.placed` class)
- Hover transforms (`scale(1.05)`)
- Click/interaction handling
- Box-shadow patterns for borders
- Mouse down/up interaction logic

## Proposed Refactoring Solution

### 1. **Create BaseSelection.vue Component**

**Purpose:** Generic selection container component that handles common layout and team management.

**Location:** `/src/components/BaseSelection.vue`

**Features:**
- Generic template with slot for item rendering
- Built-in team selection state management
- Clear all functionality
- Shared controls row layout
- Configurable props for customization

**Usage:**
```vue
<BaseSelection
  :items="characters"
  :images="characterImages"
  :showTeamCounts="true"
  itemsName="characters"
  @itemClick="handleCharacterClick"
>
  <template #items="{ items, selectedTeam, images, onItemClick }">
    <!-- Custom item rendering -->
  </template>
</BaseSelection>
```

### 2. **Create useSelectionState Composable**

**Purpose:** Shared logic for team selection and grid management.

**Location:** `/src/composables/useSelectionState.ts`

**Features:**
- Team selection state (`selectedTeam`)
- Team change handler
- Clear all functionality
- Grid store integration

**API:**
```typescript
const {
  selectedTeam,
  gridStore,
  handleTeamChange,
  handleClearAll
} = useSelectionState()
```

### 3. **Create useItemDisplay Composable**

**Purpose:** Common item interaction patterns and styling logic.

**Location:** `/src/composables/useItemDisplay.ts`

**Features:**
- Mouse interaction handling (click threshold)
- CSS class generation utilities
- Common interaction states
- Drag and drop integration helpers

**API:**
```typescript
const {
  isMouseDown,
  handleMouseDown,
  handleMouseUp,
  getItemDisplayClasses
} = useItemDisplay()
```

### 4. **Create Shared Item Styles**

**Purpose:** Consolidated styling for all item display components.

**Location:** `/src/styles/item-display.css`

**Features:**
- Base item display styling
- Hover and interaction states
- Placement state indicators
- Consistent sizing and spacing
- Draggable states

### 5. **Enhanced Individual Item Components**

**Improvements for Character.vue and Artifact.vue:**
- Use shared base styles
- Leverage common interaction logic
- Maintain unique styling while sharing base patterns
- Reduced code duplication

## Implementation Plan

### Phase 1: Create Shared Infrastructure
1. **Create `useSelectionState.ts`** - Team selection logic
2. **Create `useItemDisplay.ts`** - Item interaction patterns
3. **Create `item-display.css`** - Shared styling

### Phase 2: Create Base Component
4. **Create `BaseSelection.vue`** - Generic selection container
5. **Test base component** with sample data

### Phase 3: Refactor Existing Components
6. **Refactor `CharacterSelection.vue`** to use BaseSelection
7. **Refactor `ArtifactSelection.vue`** to use BaseSelection
8. **Update `Character.vue`** to use shared composables and styles
9. **Update `Artifact.vue`** to use shared composables and styles

### Phase 4: Validation
10. **Run build and type checks**
11. **Test drag and drop functionality**
12. **Verify team switching behavior**
13. **Test character/artifact placement**
14. **Update any affected tests**

## Expected Benefits

### **Immediate Benefits:**
- **~60% reduction** in template and script duplication
- **~150+ lines** of duplicate code elimination
- **Single source of truth** for selection patterns
- **Improved consistency** across selection components

### **Long-term Benefits:**
- **Easier maintenance** - Changes apply to all selection components
- **Faster development** - New selection components can reuse infrastructure
- **Better testing** - Test shared logic once instead of multiple times
- **Enhanced consistency** - Unified behavior and styling

### **Architecture Benefits:**
- **Follows DRY principle** - Don't Repeat Yourself
- **Aligns with project's layered architecture**
- **Composable-first approach** - Reusable logic
- **Component composition** - Generic base + specific implementations

## Files That Would Benefit

### **Primary Targets:**
- `/src/components/CharacterSelection.vue` - Major refactoring
- `/src/components/ArtifactSelection.vue` - Major refactoring
- `/src/components/Character.vue` - Minor improvements
- `/src/components/Artifact.vue` - Minor improvements

### **New Files Created:**
- `/src/components/BaseSelection.vue` - New generic component
- `/src/composables/useSelectionState.ts` - New composable
- `/src/composables/useItemDisplay.ts` - New composable
- `/src/styles/item-display.css` - New shared styles

## Code Examples

### **Before (Duplicated):**
```vue
<!-- CharacterSelection.vue -->
<div class="character-selection">
  <div class="controls-row">
    <TeamToggle :selectedTeam="selectedTeam" @team-change="handleTeamChange" />
    <ClearButton @click="handleClearAll" />
  </div>
  <div class="characters">...</div>
</div>

<!-- ArtifactSelection.vue -->  
<div class="artifact-selection">
  <div class="controls-row">
    <TeamToggle :selectedTeam="selectedTeam" @team-change="handleTeamChange" />
    <ClearButton @click="handleClearAll" />
  </div>
  <div class="artifacts">...</div>
</div>
```

### **After (Refactored):**
```vue
<!-- CharacterSelection.vue -->
<BaseSelection
  :items="characters"
  :images="characterImages"
  :showTeamCounts="true"
  @itemClick="handleCharacterClick"
>
  <template #items="{ items, selectedTeam, images }">
    <!-- Character-specific rendering -->
  </template>
</BaseSelection>

<!-- ArtifactSelection.vue -->
<BaseSelection
  :items="artifacts"
  :images="artifactImages"
  @itemClick="handleArtifactClick"
>
  <template #items="{ items, selectedTeam, images }">
    <!-- Artifact-specific rendering -->
  </template>
</BaseSelection>
```

## Risk Assessment

### **Low Risk:**
- **No breaking changes** to existing functionality
- **Incremental refactoring** - can be done step by step
- **Existing tests** will validate behavior is preserved
- **TypeScript** will catch any integration issues

### **Considerations:**
- **Requires testing** drag and drop behavior
- **Need to verify** team switching still works correctly
- **Should validate** character/artifact placement logic
- **May need to update** any component-specific styles

## Future Extensions

This refactoring sets the foundation for:
- **Additional selection components** (e.g., map selection, preset selection)
- **Enhanced filtering/search** across all selection types
- **Consistent keyboard navigation** for all selection components
- **Unified accessibility features** across selections
- **Shared animation/transition patterns**

## Conclusion

This refactoring represents a significant improvement in code organization and maintainability while following the project's established patterns. The consolidation of duplicate code will make future development more efficient and reduce the potential for inconsistencies.

The modular approach using composables and generic components aligns with Vue 3 best practices and the project's TypeScript-first approach.