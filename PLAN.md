# Pathfinding Architecture Refactoring Plan

## Objective
Consolidate all pathfinding logic into `src/lib/pathfinding.ts` following functional programming principles, making it framework-agnostic, and simplifying the overall architecture.

## Current Architecture Problems

1. **Scattered Logic**: Pathfinding logic is spread across multiple files:
   - `/src/lib/pathfinding.ts` - Low-level algorithms (A*, BFS, effective distance)
   - `/src/lib/sharedPathfinding.ts` - Target selection and tie-breaking logic
   - `/src/lib/grid.ts` - Contains `getClosestEnemyMap()` and `getClosestAllyMap()`
   - `/src/stores/pathfinding.ts` - Contains debug pathfinding logic and computed properties

2. **Framework Coupling**: Current implementation has dependencies on Vue-specific patterns

3. **Class-based Design**: Uses static class methods instead of pure functions

4. **Redundant Abstraction**: `sharedPathfinding.ts` exists only to share logic between multiple files

## Proposed Architecture

### 1. Single Source File: `src/lib/pathfinding.ts`
All pathfinding logic consolidated into one framework-agnostic module with pure functions.

### 2. Functional API Design
```typescript
// Core pathfinding algorithms
export function findPath(...): Hex[] | null
export function calculateEffectiveDistance(...): DistanceResult
export function calculateRangedMovementDistance(...): RangedDistanceResult

// Target selection and tie-breaking
export function findClosestTarget(...): TargetResult | null
export function findAllClosestTargets(...): TargetResult[]

// High-level APIs for game logic
export function getClosestEnemyMap(...): Map<number, TargetInfo>
export function getClosestAllyMap(...): Map<number, TargetInfo>

// Utility functions
export function areHexesInSameRow(...): boolean
export function isVerticallyAligned(...): boolean

// Cache management
export function clearPathfindingCache(): void
```

### 3. Pure Functional Approach
- All functions will be pure (no side effects except caching)
- No class-based static methods
- Immutable data structures where possible
- Clear separation between pure calculations and cache management

### 4. Grid Class Changes
- Remove `getClosestEnemyMap()` and `getClosestAllyMap()` methods
- Grid class focuses only on grid state management
- Pathfinding calculations moved to pathfinding module

### 5. Store Simplification
`/src/stores/pathfinding.ts` becomes minimal:
```typescript
export const usePathfindingStore = defineStore('pathfinding', () => {
  // Simple computed properties that call pathfinding functions
  const closestEnemyMap = computed(() => {
    const tiles = characterStore.getTilesWithCharacters()
    const ranges = gameDataStore.characterRanges
    return getClosestEnemyMap(tiles, ranges)
  })
  
  // Similar for closestAllyMap and debugPathfindingResults
})
```

## Migration Steps

### Phase 1: Consolidate Functions
1. Move all functions from `sharedPathfinding.ts` to `pathfinding.ts`
2. Convert class-based methods to pure functions
3. Update imports throughout the codebase

### Phase 2: Extract Grid Methods
1. Move `getClosestEnemyMap()` and `getClosestAllyMap()` from Grid to pathfinding
2. Update these functions to accept tiles as parameters instead of accessing grid state
3. Update Grid class calls to use the new functions

### Phase 3: Simplify Store
1. Remove all pathfinding logic from the store
2. Keep only computed properties that call pathfinding functions
3. Ensure debug results use the same pathfinding functions

### Phase 4: Optimize and Document
1. Review all functions for functional programming best practices
2. Add comprehensive JSDoc documentation
3. Ensure all functions are framework-agnostic

## Benefits

1. **Single Source of Truth**: All pathfinding logic in one file
2. **Framework Agnostic**: Can be used outside Vue.js if needed
3. **Functional Programming**: Easier to test, reason about, and maintain
4. **Simplified Architecture**: Fewer files, clearer responsibilities
5. **Better Performance**: Centralized caching, optimized algorithms

## Testing Strategy

1. Ensure all existing tests pass
2. Add unit tests for pure functions
3. Verify arrows and debug lines still show identical results
4. Performance testing for large grids

## File Structure After Refactoring

```
src/lib/
  pathfinding.ts     # All pathfinding logic (pure functions)
  grid.ts           # Grid state management only
  
src/stores/
  pathfinding.ts    # Minimal store with computed properties only
```

## Risks and Mitigations

1. **Risk**: Breaking existing functionality
   - **Mitigation**: Comprehensive testing at each phase

2. **Risk**: Performance regression
   - **Mitigation**: Maintain existing caching strategies

3. **Risk**: Type safety issues
   - **Mitigation**: Careful TypeScript typing throughout

## Timeline

- Phase 1: 30 minutes
- Phase 2: 45 minutes  
- Phase 3: 20 minutes
- Phase 4: 25 minutes
- Testing: 30 minutes

Total estimated time: ~2.5 hours