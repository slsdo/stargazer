# Store/Grid.ts Refactoring Plan

## Current State Analysis

The `store/grid.ts` file is currently 709 lines and has grown to handle multiple responsibilities:

### Current Responsibilities
1. **Core Grid State Management** - Wrapping the framework-agnostic Grid class
2. **Data Loading** - Characters, artifacts, images, icons
3. **Character Management** - Placement, movement, swapping, team management
4. **Pathfinding & Distance Calculations** - Debug visualization, closest enemy/ally maps
5. **Artifact Management** - Placement and removal
6. **Map Editor Functionality** - Hex state painting, clearing
7. **URL State Management** - Saving/restoring grid state
8. **Reactive State Management** - Manual reactivity triggers

### Key Architectural Constraint
- `lib/grid.ts` is designed as the main global state manager (framework-agnostic)
- `store/grid.ts` should be a thin reactive wrapper for Vue.js integration

## Problems Identified

1. **Manual Reactivity Triggers** - `characterUpdateTrigger.value++` is an anti-pattern indicating improper reactivity
2. **Mixed Concerns** - The store handles too many unrelated responsibilities
3. **Large File Size** - 709 lines makes it difficult to maintain and understand
4. **Complex Computed Properties** - Heavy computations like pathfinding in computed properties
5. **Violation of Thin Wrapper Principle** - Store has grown beyond being a simple reactive interface

## Pros of Refactoring

1. **Better Separation of Concerns** - Each store handles one specific domain
2. **Improved Maintainability** - Smaller, focused files are easier to understand
3. **Better Performance** - Specialized stores can optimize their specific operations
4. **Proper Reactivity** - Eliminate manual triggers with better state design
5. **Easier Testing** - Smaller units are easier to test in isolation
6. **Better Type Safety** - Focused stores can have more specific typing
7. **Scalability** - New features can be added to appropriate stores

## Cons of Refactoring

1. **Migration Effort** - Need to update all components using the store
2. **Risk of Regression** - Complex refactor could introduce bugs
3. **Learning Curve** - Developers need to know which store to use
4. **Cross-Store Communication** - May need to coordinate between stores
5. **Initial Performance Hit** - Multiple stores may have slight overhead

## Recommendation: Proceed with Refactoring

The benefits significantly outweigh the costs. The current manual reactivity triggers and mixed responsibilities are technical debt that will only grow worse.

## Proposed Architecture

### Store Structure
```
stores/
├── grid.ts          # Core grid operations only
├── character.ts     # Character placement, movement, teams
├── artifact.ts      # Artifact management
├── gameData.ts      # Static game data (characters, artifacts, images)
├── mapEditor.ts     # Map editing functionality
├── pathfinding.ts   # Pathfinding computations and visualizations
└── urlState.ts      # URL state serialization/deserialization
```

### 1. Core Grid Store (`grid.ts`)
**Responsibilities:**
- Wrap Grid class instance
- Provide reactive hex/tile access
- Handle basic grid state (hexes, states)
- Expose layout utilities

**Key Methods:**
- `getTile()`, `getAllTiles()`, `getHexById()`
- `setState()` (for map editor)
- `switchMap()`

### 2. Character Store (`character.ts`)
**Responsibilities:**
- Character placement/removal
- Team management
- Character movement and swapping
- Character availability tracking

**Key Methods:**
- `placeCharacter()`, `removeCharacter()`, `moveCharacter()`
- `swapCharacters()`, `autoPlaceCharacter()`
- `getCharacterOnHex()`, `canPlaceCharacter()`

**Reactive State:**
- `characterPlacements`
- `availableAlly`, `availableEnemy`
- `teamCounts`

### 3. Artifact Store (`artifact.ts`)
**Responsibilities:**
- Artifact placement/removal per team
- Artifact state tracking

**State:**
- `allyArtifact`, `enemyArtifact`

### 4. Game Data Store (`gameData.ts`)
**Responsibilities:**
- Load and cache static game data
- Provide character/artifact definitions
- Manage image assets

**State:**
- `characters`, `artifacts`
- `characterImages`, `artifactImages`, `icons`
- `characterRanges`

### 5. Map Editor Store (`mapEditor.ts`)
**Responsibilities:**
- Map editing operations
- Bulk hex state changes

**Methods:**
- `setHexState()`, `clearAllHexStates()`
- `resetToCurrentMap()`

### 6. Pathfinding Store (`pathfinding.ts`)
**Responsibilities:**
- Expensive pathfinding computations
- Debug visualization data
- Closest enemy/ally calculations

**Computed (Lazy):**
- `closestEnemyMap`, `closestAllyMap`
- `debugPathfindingResults`

### 7. URL State Store (`urlState.ts`)
**Responsibilities:**
- Serialize current state to URL
- Deserialize and restore from URL

## Implementation Strategy

### Phase 1: Fix Reactivity (High Priority)
1. Implement proper reactive wrapper around Grid class
2. Eliminate `characterUpdateTrigger` by using proper Vue reactivity patterns
3. Options:
   - Use `reactive()` with proper nested updates
   - Implement immutable update patterns
   - Use reactive Map/Set for character placements

### Phase 2: Extract Stores (Medium Priority)
1. Start with least coupled stores: `gameData`, `artifact`
2. Extract `mapEditor` functionality
3. Extract `pathfinding` computations
4. Extract `character` management
5. Finally, slim down core `grid` store

### Phase 3: Update Components
1. Update imports in components
2. Use appropriate stores for each operation
3. Test thoroughly after each component update

### Phase 4: Optimization
1. Implement proper caching strategies per store
2. Optimize cross-store communication if needed
3. Performance testing

## Alternative Approach: Minimal Refactor

If full refactoring is deemed too risky, consider:

1. **Fix Reactivity Only** - Address the manual trigger issue without splitting stores
2. **Extract Composables** - Move complex logic to composables instead of separate stores
3. **Gradual Extraction** - Only extract the most problematic parts (pathfinding, map editor)

## Decision Criteria

Proceed with full refactor if:
- [ ] Team has bandwidth for 2-3 day effort
- [ ] Good test coverage exists or can be added
- [ ] Application will continue to grow in complexity
- [ ] Performance issues are noticeable

Consider minimal refactor if:
- [ ] Need quick fix for reactivity issues
- [ ] Limited development resources
- [ ] Application complexity is stable

## Next Steps

1. **Get stakeholder buy-in** on refactoring approach
2. **Add integration tests** for current functionality
3. **Create feature branch** for refactoring work
4. **Implement Phase 1** (reactivity fix) first
5. **Measure performance** before/after each phase