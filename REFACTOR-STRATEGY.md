# findClosestTarget Refactoring Strategy

## Current Issues

1. **Code Duplication**: Two separate code paths for ranged (BFS) and melee (A*) units
2. **Length**: Function is ~90 lines with complex branching logic
3. **Inconsistent Approaches**: Different algorithms and data structures for similar problems
4. **Tie-breaking Applied Differently**: Ranged uses candidates list, melee applies inline

## Key Insight

The melee case (range = 1) can indeed be treated as a subset of the ranged case. Both are finding the minimum movement distance to engage a target, just with different ranges.

## Proposed Refactoring Strategy

### Option 1: Unified BFS Approach (Recommended)

**Concept**: Use BFS for both ranged and melee units since we're finding minimum movement distance to ANY target.

**Benefits**:
- Single algorithm for all cases
- Consistent performance characteristics
- Simpler code structure
- Natural tie-breaking through BFS exploration order

**Implementation**:
```typescript
export function findClosestTarget(...): TargetResult | null {
  // 1. Input validation
  
  // 2. Use calculateRangedMovementDistance for ALL cases
  const targetHexes = targetTiles.map(tile => tile.hex)
  const result = calculateRangedMovementDistance(
    sourceTile.hex,
    targetHexes,
    sourceRange, // Works for both range=1 and range>1
    getTile,
    canTraverse
  )
  
  // 3. Apply tie-breaking to reachable targets
  if (!result.canReach) return null
  
  const candidateTiles = targetTiles.filter(tile =>
    result.reachableTargets.some(hex => hex.equals(tile.hex))
  )
  
  const bestTarget = applyTieBreakingRules(candidateTiles, sourceTile.hex)
  
  return {
    hexId: bestTarget.hex.getId(),
    distance: result.movementDistance
  }
}
```

### Option 2: Extract Common Logic

**Concept**: Keep separate algorithms but extract shared logic into helper functions.

**Benefits**:
- Preserves current algorithmic choices
- Reduces duplication through shared helpers
- Easier to test individual components

**Implementation**:
```typescript
// Helper to find candidates at minimum distance
function findCandidatesAtMinDistance(
  sourceTile: GridTile,
  targetTiles: GridTile[],
  sourceRange: number,
  getTile: Function,
  canTraverse: Function,
  cache: PathfindingCache
): { candidates: GridTile[], distance: number } | null {
  // Common logic for finding minimum distance targets
}

export function findClosestTarget(...): TargetResult | null {
  // 1. Input validation
  
  // 2. Get candidates at minimum distance
  const result = findCandidatesAtMinDistance(...)
  if (!result) return null
  
  // 3. Apply tie-breaking
  const bestTarget = applyTieBreakingRules(result.candidates, sourceTile.hex)
  
  return {
    hexId: bestTarget.hex.getId(),
    distance: result.distance
  }
}
```

### Option 3: Strategy Pattern

**Concept**: Use strategy pattern to select pathfinding algorithm based on unit type.

**Benefits**:
- Clean separation of algorithms
- Easy to add new strategies
- Testable in isolation

**Implementation**:
```typescript
interface PathfindingStrategy {
  findReachableTargets(
    source: Hex,
    targets: Hex[],
    range: number,
    getTile: Function,
    canTraverse: Function
  ): RangedDistanceResult
}

class BFSStrategy implements PathfindingStrategy { ... }
class AStarStrategy implements PathfindingStrategy { ... }

export function findClosestTarget(...): TargetResult | null {
  // Select strategy based on range
  const strategy = sourceRange > 1 ? new BFSStrategy() : new AStarStrategy()
  
  // Use strategy to find targets
  const result = strategy.findReachableTargets(...)
  
  // Common tie-breaking logic
  // ...
}
```

## Recommendation

**Go with Option 1 (Unified BFS Approach)** because:

1. **Simplicity**: One algorithm to understand and maintain
2. **Performance**: BFS is optimal for finding minimum distance to ANY target
3. **Correctness**: The current melee implementation already finds the closest target first, so BFS will give the same result
4. **Cache Efficiency**: Single cache key format and strategy
5. **Future-proof**: Easy to extend for new unit types or ranges

## Migration Path

1. **Phase 1**: Refactor `findClosestTarget` to use unified BFS
2. **Phase 2**: Remove the now-unnecessary A* logic from this function
3. **Phase 3**: Update caching to use consistent keys
4. **Phase 4**: Simplify `calculateEffectiveDistance` (only needed for specific path queries)

## Testing Considerations

- Ensure melee units still behave identically
- Verify performance is acceptable for large grids
- Check cache hit rates remain high
- Validate tie-breaking produces same results