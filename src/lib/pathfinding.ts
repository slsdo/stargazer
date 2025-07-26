import { Hex } from './hex'
import { State } from './types/state'
import { Team } from './types/team'
import type { GridTile } from './grid'
import { PriorityQueue } from './priorityQueue'
import { MemoCache, generatePathCacheKey, generateGridCacheKey } from './memoization'
import { FULL_GRID, type GridPreset } from './constants'

// Types
interface PathNode {
  hex: Hex
  g: number // Cost from start to this node
  h: number // Heuristic (estimated cost to goal)
  f: number // Total cost (g + h)
  parent: PathNode | null
}

interface DistanceResult {
  movementDistance: number
  canReach: boolean
  directDistance: number
}

interface RangedDistanceResult {
  movementDistance: number
  canReach: boolean
  reachableTargets: Hex[]
}

interface TargetResult {
  hexId: number
  distance: number
}

interface TargetInfo {
  enemyHexId?: number
  allyHexId?: number
  distance: number
}

// ============================================================================
// Caching System
// ============================================================================

/**
 * Centralized cache management for pathfinding operations.
 * Provides a clean interface for different cache types while maintaining performance.
 */
export class PathfindingCache {
  private pathCache = new MemoCache<string, Hex[] | null>(500)
  private effectiveDistanceCache = new MemoCache<string, DistanceResult>(500)
  private closestEnemyCache = new MemoCache<string, Map<number, TargetInfo>>(100)
  private closestAllyCache = new MemoCache<string, Map<number, TargetInfo>>(100)

  // Path cache operations
  getPath(key: string): Hex[] | null | undefined {
    return this.pathCache.get(key)
  }

  setPath(key: string, value: Hex[] | null): void {
    this.pathCache.set(key, value)
  }

  // Effective distance cache operations
  getEffectiveDistance(key: string): DistanceResult | undefined {
    return this.effectiveDistanceCache.get(key)
  }

  setEffectiveDistance(key: string, value: DistanceResult): void {
    this.effectiveDistanceCache.set(key, value)
  }

  // Closest enemy cache operations
  getClosestEnemyMap(key: string): Map<number, TargetInfo> | undefined {
    return this.closestEnemyCache.get(key)
  }

  setClosestEnemyMap(key: string, value: Map<number, TargetInfo>): void {
    this.closestEnemyCache.set(key, value)
  }

  // Closest ally cache operations
  getClosestAllyMap(key: string): Map<number, TargetInfo> | undefined {
    return this.closestAllyCache.get(key)
  }

  setClosestAllyMap(key: string, value: Map<number, TargetInfo>): void {
    this.closestAllyCache.set(key, value)
  }

  // Cache management operations
  clear(): void {
    this.pathCache.clear()
    this.effectiveDistanceCache.clear()
    this.closestEnemyCache.clear()
    this.closestAllyCache.clear()
  }

  clearSpecific(cacheType: 'path' | 'effectiveDistance' | 'closestEnemy' | 'closestAlly'): void {
    switch (cacheType) {
      case 'path':
        this.pathCache.clear()
        break
      case 'effectiveDistance':
        this.effectiveDistanceCache.clear()
        break
      case 'closestEnemy':
        this.closestEnemyCache.clear()
        break
      case 'closestAlly':
        this.closestAllyCache.clear()
        break
    }
  }

  // Cache statistics for debugging
  getStats() {
    return {
      pathCacheSize: this.pathCache.size,
      effectiveDistanceCacheSize: this.effectiveDistanceCache.size,
      closestEnemyCacheSize: this.closestEnemyCache.size,
      closestAllyCacheSize: this.closestAllyCache.size,
    }
  }
}

// Default cache instance for module-level operations
const defaultCache = new PathfindingCache()

// ============================================================================
// Core Pathfinding Algorithms
// ============================================================================

/**
 * A* pathfinding algorithm for hex grids.
 * Finds the shortest path between two hexes considering obstacles.
 */
export function findPath(
  start: Hex,
  goal: Hex,
  getTile: (hex: Hex) => GridTile | undefined,
  canTraverse: (tile: GridTile) => boolean,
): Hex[] | null {
  const openSet = new PriorityQueue<PathNode>()
  const closedSet = new Set<string>()
  const nodeMap = new Map<string, PathNode>()

  // Create start node
  const startNode: PathNode = {
    hex: start,
    g: 0,
    h: start.distance(goal),
    f: start.distance(goal),
    parent: null,
  }

  openSet.enqueue(startNode, startNode.f)
  nodeMap.set(start.toString(), startNode)

  while (!openSet.isEmpty()) {
    const current = openSet.dequeue()
    if (!current) break

    // Check if we reached the goal
    if (current.hex.equals(goal)) {
      // Reconstruct path
      const path: Hex[] = []
      let node: PathNode | null = current
      while (node) {
        path.unshift(node.hex)
        node = node.parent
      }
      return path
    }

    closedSet.add(current.hex.toString())

    // Check all 6 neighbors
    for (let direction = 0; direction < 6; direction++) {
      const neighbor = current.hex.neighbor(direction)
      const neighborKey = neighbor.toString()

      // Skip if already evaluated
      if (closedSet.has(neighborKey)) {
        continue
      }

      // Skip if not traversable
      const tile = getTile(neighbor)
      if (!tile || !canTraverse(tile)) {
        continue
      }

      // Calculate tentative g score
      const tentativeG = current.g + 1

      // Check if neighbor is already known
      let neighborNode = nodeMap.get(neighborKey)

      if (!neighborNode) {
        // Create new node
        neighborNode = {
          hex: neighbor,
          g: tentativeG,
          h: neighbor.distance(goal),
          f: tentativeG + neighbor.distance(goal),
          parent: current,
        }
        nodeMap.set(neighborKey, neighborNode)
        openSet.enqueue(neighborNode, neighborNode.f)
      } else if (tentativeG < neighborNode.g) {
        // Update existing node if we found a better path
        neighborNode.g = tentativeG
        neighborNode.f = tentativeG + neighborNode.h
        neighborNode.parent = current
        // Update priority in queue
        openSet.updatePriority(neighborNode, neighborNode.f, (a, b) => a.hex.equals(b.hex))
      }
    }
  }

  // No path found
  return null
}

/**
 * Find shortest path distance considering obstacles.
 * Returns the number of steps needed to reach the goal, or null if no path exists.
 */
export function findPathDistance(
  start: Hex,
  goal: Hex,
  getTile: (hex: Hex) => GridTile | undefined,
  canTraverse: (tile: GridTile) => boolean,
): number | null {
  const path = findPath(start, goal, getTile, canTraverse)
  return path ? path.length - 1 : null // Subtract 1 to get number of steps
}

/**
 * Calculate effective movement distance considering character range.
 * Characters can attack without moving if target is within range, bypassing blocked tiles.
 * Returns movement tiles needed (0 if already in range) rather than total path distance.
 */
export function calculateEffectiveDistance(
  start: Hex,
  goal: Hex,
  range: number,
  getTile: (hex: Hex) => GridTile | undefined,
  canTraverse: (tile: GridTile) => boolean,
  cachingEnabled: boolean = false,
  cache: PathfindingCache = defaultCache,
): DistanceResult {
  // Check cache first if caching is enabled
  if (cachingEnabled) {
    const cacheKey = generatePathCacheKey(start.getId(), goal.getId(), range)
    const cached = cache.getEffectiveDistance(cacheKey)
    if (cached) {
      return cached
    }
  }

  // Calculate direct hex distance (ignoring obstacles)
  const directDistance = start.distance(goal)

  // If target is within range, no movement needed
  if (directDistance <= range) {
    const result = { movementDistance: 0, canReach: true, directDistance }
    if (cachingEnabled) {
      const cacheKey = generatePathCacheKey(start.getId(), goal.getId(), range)
      cache.setEffectiveDistance(cacheKey, result)
    }
    return result
  }

  // Need to move closer - find path to get within range
  const path = findPath(start, goal, getTile, canTraverse)

  if (!path) {
    // No path exists, cannot reach target
    const result = { movementDistance: Infinity, canReach: false, directDistance }
    if (cachingEnabled) {
      const cacheKey = generatePathCacheKey(start.getId(), goal.getId(), range)
      cache.setEffectiveDistance(cacheKey, result)
    }
    return result
  }

  // Calculate how many tiles we need to move to get within range
  const pathLength = path.length - 1 // Subtract 1 because path includes start position
  const movementNeeded = Math.max(0, pathLength - range)

  const result = {
    movementDistance: movementNeeded,
    canReach: true,
    directDistance,
  }

  if (cachingEnabled) {
    const cacheKey = generatePathCacheKey(start.getId(), goal.getId(), range)
    cache.setEffectiveDistance(cacheKey, result)
  }
  return result
}

/**
 * Calculate minimum movement distance for a ranged unit to reach any target.
 * Uses BFS to find the shortest path to a position where the unit can attack any target.
 * Returns all reachable targets at the minimum distance for proper tie-breaking.
 */
export function calculateRangedMovementDistance(
  start: Hex,
  targets: Hex[],
  range: number,
  getTile: (hex: Hex) => GridTile | undefined,
  canTraverse: (tile: GridTile) => boolean,
): RangedDistanceResult {
  if (targets.length === 0) {
    return { movementDistance: Infinity, canReach: false, reachableTargets: [] }
  }

  // First check if already within range of any target
  const immediateTargets: Hex[] = []
  for (const target of targets) {
    const directDistance = start.distance(target)
    if (directDistance <= range) {
      immediateTargets.push(target)
    }
  }
  
  if (immediateTargets.length > 0) {
    return { movementDistance: 0, canReach: true, reachableTargets: immediateTargets }
  }

  // BFS to find minimum moves to get within range of any target
  let currentMoves = 0
  let currentQueue: Hex[] = [start]
  let nextQueue: Hex[] = []
  const visited = new Set<string>()
  visited.add(start.toString())

  while (currentQueue.length > 0 && currentMoves < 20) {
    const reachableAtThisDistance: Hex[] = []
    
    // Process all positions at current movement distance
    for (const currentHex of currentQueue) {
      // Try all 6 directions from current position
      for (let direction = 0; direction < 6; direction++) {
        const neighbor = currentHex.neighbor(direction)
        const neighborKey = neighbor.toString()
        
        if (visited.has(neighborKey)) continue
        
        const tile = getTile(neighbor)
        if (!tile || !canTraverse(tile)) continue
        
        visited.add(neighborKey)
        nextQueue.push(neighbor)
        
        // Check if from this new position, we can reach any target
        for (const target of targets) {
          const distanceToTarget = neighbor.distance(target)
          if (distanceToTarget <= range) {
            reachableAtThisDistance.push(target)
          }
        }
      }
    }
    
    // If we found targets at this distance, return them all for tie-breaking
    if (reachableAtThisDistance.length > 0) {
      // Remove duplicates
      const uniqueTargets = Array.from(new Set(reachableAtThisDistance.map(h => h.toString())))
        .map(str => reachableAtThisDistance.find(h => h.toString() === str)!)
      
      return { 
        movementDistance: currentMoves + 1, 
        canReach: true, 
        reachableTargets: uniqueTargets 
      }
    }
    
    // Move to next movement distance
    currentQueue = nextQueue
    nextQueue = []
    currentMoves++
  }

  return { movementDistance: Infinity, canReach: false, reachableTargets: [] }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Default traversal function - allows movement through all tiles except blocked ones.
 */
export function defaultCanTraverse(tile: GridTile): boolean {
  return tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE
}

/**
 * Check if two hexes are in the same row based on the grid preset.
 * Used for tie-breaking when multiple targets have the same movement distance.
 */
export function areHexesInSameRow(hexId1: number, hexId2: number, gridPreset: GridPreset = FULL_GRID): boolean {
  for (const row of gridPreset.hex) {
    if (row.includes(hexId1) && row.includes(hexId2)) {
      return true
    }
  }
  return false
}

/**
 * Check if source and target hex are vertically aligned (same q coordinate).
 * Vertical alignment means a straight line with no turns required.
 */
export function isVerticallyAligned(sourceHex: Hex, targetHex: Hex): boolean {
  return sourceHex.q === targetHex.q
}

// ============================================================================
// Target Selection and Tie-Breaking
// ============================================================================

/**
 * Find the closest reachable target using optimized pathfinding algorithms.
 * 
 * This is the core pathfinding function used by both main grid calculations and debug
 * visualization to ensure consistent target selection across the entire application.
 * 
 * Algorithm Selection:
 * - **Ranged units (range > 1)**: Uses BFS-based `calculateRangedMovementDistance()` to find
 *   the minimum movement required to get within range of ANY target, then applies tie-breaking
 *   to all targets reachable at that minimum distance.
 * - **Melee units (range = 1)**: Uses individual target pathfinding with `calculateEffectiveDistance()`
 *   for each potential target, then applies tie-breaking rules.
 * 
 * Comprehensive Tie-breaking Rules (applied in order):
 * 1. **Vertical alignment priority**: Prefer targets in straight vertical lines (same q coordinate)
 *    as these require no turns and represent the most direct path.
 * 2. **Same-row hex ID priority**: When targets are in the same row of the grid preset, prefer
 *    the target with the lower hex ID for consistent, predictable behavior.
 * 3. **Fallback hex ID priority**: For all other tied cases, prefer lower hex ID as final tiebreaker.
 * 
 * @param sourceTile - The tile containing the character seeking a target
 * @param targetTiles - Array of potential target tiles to evaluate
 * @param sourceRange - Attack range of the source character (1 for melee, >1 for ranged)
 * @param getTile - Function to safely retrieve tiles, returns undefined for out-of-bounds
 * @param canTraverse - Function to check if a tile can be moved through during pathfinding
 * @param gridPreset - Grid layout preset for accurate row detection (defaults to FULL_GRID)
 * @param cachingEnabled - Whether to use pathfinding result caching for performance
 * @returns Object with target hex ID and movement distance, or null if no targets reachable
 */
export function findClosestTarget(
  sourceTile: GridTile,
  targetTiles: GridTile[],
  sourceRange: number,
  getTile: (hex: Hex) => GridTile | undefined,
  canTraverse: (tile: GridTile) => boolean,
  gridPreset: GridPreset = FULL_GRID,
  cachingEnabled: boolean = false,
  cache: PathfindingCache = defaultCache,
): TargetResult | null {
  if (targetTiles.length === 0) {
    return null
  }

  // For ranged units (range > 1), use optimized ranged movement calculation
  if (sourceRange > 1) {
    const targetHexes = targetTiles.map(tile => tile.hex)
    const rangedResult = calculateRangedMovementDistance(
      sourceTile.hex,
      targetHexes,
      sourceRange,
      getTile,
      canTraverse,
    )

    if (!rangedResult.canReach || rangedResult.reachableTargets.length === 0) {
      return null
    }

    // Convert reachable target hexes back to tiles for tie-breaking
    const candidateTargets = targetTiles.filter(tile => 
      rangedResult.reachableTargets.some(reachableHex => reachableHex.equals(tile.hex))
    )

    if (candidateTargets.length === 0) {
      return null
    }

    // Apply tie-breaking rules to candidate targets
    let bestTarget = candidateTargets[0]
    for (let i = 1; i < candidateTargets.length; i++) {
      const currentTarget = candidateTargets[i]
      const currentIsVertical = isVerticallyAligned(sourceTile.hex, currentTarget.hex)
      const bestIsVertical = isVerticallyAligned(sourceTile.hex, bestTarget.hex)
      
      if (currentIsVertical && !bestIsVertical) {
        // Prefer vertical alignment
        bestTarget = currentTarget
      } else if (!currentIsVertical && bestIsVertical) {
        // Keep current best (already vertical)
      } else if (areHexesInSameRow(currentTarget.hex.getId(), bestTarget.hex.getId(), gridPreset)) {
        // Same row: prefer lower hex ID
        if (currentTarget.hex.getId() < bestTarget.hex.getId()) {
          bestTarget = currentTarget
        }
      } else if (!currentIsVertical && !bestIsVertical) {
        // Neither vertical, use hex ID comparison as final fallback
        if (currentTarget.hex.getId() < bestTarget.hex.getId()) {
          bestTarget = currentTarget
        }
      }
    }

    return {
      hexId: bestTarget.hex.getId(),
      distance: rangedResult.movementDistance,
    }
  }

  // For melee units (range = 1), use existing logic with individual target pathfinding
  let closest: TargetResult | null = null

  for (const targetTile of targetTiles) {
    const canTraverseToTarget = (tile: GridTile) => {
      if (tile.hex.equals(targetTile.hex)) {
        return true
      }
      return canTraverse(tile)
    }

    // Use range-aware pathfinding
    const effectiveDistance = calculateEffectiveDistance(
      sourceTile.hex,
      targetTile.hex,
      sourceRange,
      getTile,
      canTraverseToTarget,
      cachingEnabled,
      cache,
    )

    if (!effectiveDistance.canReach) {
      continue
    }

    // Use movement distance for comparison (tiles needed to move)
    const distance = effectiveDistance.movementDistance

    if (!closest || distance < closest.distance) {
      closest = {
        hexId: targetTile.hex.getId(),
        distance: distance,
      }
    } else if (distance === closest.distance) {
      // Apply tie-breaking rules
      const currentIsVertical = isVerticallyAligned(sourceTile.hex, targetTile.hex)
      const closestTile = targetTiles.find(t => t.hex.getId() === closest!.hexId)!
      const closestIsVertical = isVerticallyAligned(sourceTile.hex, closestTile.hex)
      
      if (currentIsVertical && !closestIsVertical) {
        // Prefer vertical alignment
        closest = {
          hexId: targetTile.hex.getId(),
          distance: distance,
        }
      } else if (!currentIsVertical && closestIsVertical) {
        // Keep current (already vertical)
      } else if (areHexesInSameRow(targetTile.hex.getId(), closest.hexId, gridPreset)) {
        // Same row: prefer lower hex ID
        if (targetTile.hex.getId() < closest.hexId) {
          closest = {
            hexId: targetTile.hex.getId(),
            distance: distance,
          }
        }
      } else if (!currentIsVertical && !closestIsVertical) {
        // Neither vertical, use hex ID comparison as final fallback
        if (targetTile.hex.getId() < closest.hexId) {
          closest = {
            hexId: targetTile.hex.getId(),
            distance: distance,
          }
        }
      }
    }
  }

  return closest
}

// ============================================================================
// High-Level Game APIs
// ============================================================================

/**
 * Calculate closest enemy for each ally character.
 * Returns map: ally hex ID -> {enemy hex ID, distance}
 * 
 * @param tilesWithCharacters - All tiles containing characters
 * @param characterRanges - Map of character IDs to their attack ranges
 * @param gridPreset - Grid layout for spatial calculations
 * @param cachingEnabled - Whether to use result caching
 */
export function getClosestEnemyMap(
  tilesWithCharacters: GridTile[],
  characterRanges: Map<string, number> = new Map(),
  gridPreset: GridPreset = FULL_GRID,
  cachingEnabled: boolean = true,
  getTile?: (hex: Hex) => GridTile | undefined,
  cache: PathfindingCache = defaultCache,
): Map<number, TargetInfo> {
  // Check cache first if caching is enabled
  if (cachingEnabled) {
    const cacheKey = generateGridCacheKey(tilesWithCharacters, characterRanges)
    const cached = cache.getClosestEnemyMap(cacheKey)
    if (cached) {
      return cached
    }
  }

  const result = new Map<number, TargetInfo>()

  // Get all tiles with characters
  const allyTiles = tilesWithCharacters.filter((tile) => tile.team === Team.ALLY)
  const enemyTiles = tilesWithCharacters.filter((tile) => tile.team === Team.ENEMY)

  // Safe getTile helper - returns undefined for out-of-bounds hexes during pathfinding
  const getTileHelper = getTile || ((hex: Hex) => {
    const tile = tilesWithCharacters.find(t => t.hex.equals(hex))
    return tile
  })

  // For each ally character, find closest enemy using shared pathfinding logic
  for (const allyTile of allyTiles) {
    const range = allyTile.character ? (characterRanges.get(allyTile.character) ?? 1) : 1
    const closestEnemy = findClosestTarget(
      allyTile, 
      enemyTiles, 
      range, 
      getTileHelper,
      defaultCanTraverse,
      gridPreset,
      cachingEnabled,
      cache,
    )

    if (closestEnemy) {
      result.set(allyTile.hex.getId(), {
        enemyHexId: closestEnemy.hexId,
        distance: closestEnemy.distance,
      })
    }
  }

  // Cache the result if caching is enabled
  if (cachingEnabled) {
    const cacheKey = generateGridCacheKey(tilesWithCharacters, characterRanges)
    cache.setClosestEnemyMap(cacheKey, result)
  }
  return result
}

/**
 * Calculate closest ally for each enemy character.
 * Returns map: enemy hex ID -> {ally hex ID, distance}
 * 
 * @param tilesWithCharacters - All tiles containing characters
 * @param characterRanges - Map of character IDs to their attack ranges
 * @param gridPreset - Grid layout for spatial calculations
 * @param cachingEnabled - Whether to use result caching
 */
export function getClosestAllyMap(
  tilesWithCharacters: GridTile[],
  characterRanges: Map<string, number> = new Map(),
  gridPreset: GridPreset = FULL_GRID,
  cachingEnabled: boolean = true,
  getTile?: (hex: Hex) => GridTile | undefined,
  cache: PathfindingCache = defaultCache,
): Map<number, TargetInfo> {
  // Check cache first if caching is enabled
  if (cachingEnabled) {
    const cacheKey = generateGridCacheKey(tilesWithCharacters, characterRanges)
    const cached = cache.getClosestAllyMap(cacheKey)
    if (cached) {
      return cached
    }
  }

  const result = new Map<number, TargetInfo>()

  // Get all tiles with characters
  const allyTiles = tilesWithCharacters.filter((tile) => tile.team === Team.ALLY)
  const enemyTiles = tilesWithCharacters.filter((tile) => tile.team === Team.ENEMY)

  // Safe getTile helper - returns undefined for out-of-bounds hexes during pathfinding
  const getTileHelper = getTile || ((hex: Hex) => {
    const tile = tilesWithCharacters.find(t => t.hex.equals(hex))
    return tile
  })

  // For each enemy character, find closest ally using shared pathfinding logic
  for (const enemyTile of enemyTiles) {
    const range = enemyTile.character ? (characterRanges.get(enemyTile.character) ?? 1) : 1
    const closestAlly = findClosestTarget(
      enemyTile, 
      allyTiles, 
      range, 
      getTileHelper,
      defaultCanTraverse,
      gridPreset,
      cachingEnabled,
      cache,
    )

    if (closestAlly) {
      result.set(enemyTile.hex.getId(), {
        allyHexId: closestAlly.hexId,
        distance: closestAlly.distance,
      })
    }
  }

  // Cache the result if caching is enabled
  if (cachingEnabled) {
    const cacheKey = generateGridCacheKey(tilesWithCharacters, characterRanges)
    cache.setClosestAllyMap(cacheKey, result)
  }
  return result
}

// ============================================================================
// Cache Management
// ============================================================================

/**
 * Clear all pathfinding caches.
 * Should be called when grid state changes significantly.
 */
export function clearPathfindingCache(cache: PathfindingCache = defaultCache): void {
  cache.clear()
}

/**
 * Clear specific cache types.
 * Useful for targeted cache invalidation.
 */
export function clearSpecificCache(
  cacheType: 'path' | 'effectiveDistance' | 'closestEnemy' | 'closestAlly',
  cache: PathfindingCache = defaultCache,
): void {
  cache.clearSpecific(cacheType)
}

/**
 * Get cache statistics for debugging.
 */
export function getCacheStats(cache: PathfindingCache = defaultCache) {
  return cache.getStats()
}