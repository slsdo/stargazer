Pathfinding Performance Optimization Plan

Overview

The main performance bottleneck is the recalculation of getClosestEnemyMap and getClosestAllyMap
on every character update. These O(n²) operations with pathfinding are being called unnecessarily
through the reactive computed properties in the grid store.

Optimization Strategy

1. Priority Queue Implementation (High Impact)

- Replace O(n) linear search in pathfinding with O(log n) min-heap
- Create src/lib/priorityQueue.ts with efficient heap operations
- Modify Pathfinding.findPath to use priority queue for open set

2. Memoization System (Very High Impact)

- Create src/lib/memoization.ts with LRU cache implementation
- Cache pathfinding results based on (start, goal, range) tuple
- Cache closest enemy/ally maps with grid state hashing
- Implement automatic cache invalidation on character moves

3. Grid-Level Caching (High Impact)

- Add caching directly in Grid class for closest target calculations
- Cache keys based on character positions and ranges
- Invalidate only affected paths on character movement

4. Batch Updates (Medium Impact)

- Modify grid store to batch multiple character operations
- Defer closest map calculations until all moves complete
- Add explicit beginBatch() and endBatch() methods

5. Incremental Updates (Advanced, Medium Impact)

- Track which hexes are affected by character movements
- Recalculate only paths involving moved characters
- Maintain partial cache validity during updates

Implementation Steps

1. Phase 1: Core Infrastructure

- Implement priority queue for A\* optimization
- Create memoization utilities with configurable cache sizes
- Add performance timing/debugging helpers

2. Phase 2: Pathfinding Cache

- Cache calculateEffectiveDistance results
- Add cache hit/miss tracking for debugging
- Implement smart cache key generation

3. Phase 3: Grid-Level Integration

- Add closest map caches to Grid class
- Implement cache invalidation on character operations
- Maintain cache consistency across operations

4. Phase 4: Store Optimization

- Optimize reactive computations in grid store
- Add batch update support
- Create optional lazy evaluation mode

Expected Performance Improvements

- Initial calculation: Same as current (builds cache)
- Subsequent identical states: ~95% reduction in computation
- Character moves: Only affected paths recalculated
- UI responsiveness: Smooth drag/drop operations

Memory Considerations

- Path cache: ~500 entries max (configurable)
- Closest map caches: ~100 entries each
- Total memory overhead: ~50-100KB typical usage
