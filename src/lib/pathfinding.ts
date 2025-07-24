import { Hex } from './hex'
import { State } from './types/state'
import type { GridTile } from './grid'
import { PriorityQueue } from './priorityQueue'
import { MemoCache, generatePathCacheKey } from './memoization'

interface PathNode {
  hex: Hex
  g: number // Cost from start to this node
  h: number // Heuristic (estimated cost to goal)
  f: number // Total cost (g + h)
  parent: PathNode | null
}

export class Pathfinding {
  // Cache for path calculations - stores results to avoid redundant pathfinding
  private static pathCache = new MemoCache<string, Hex[] | null>(500)
  private static effectiveDistanceCache = new MemoCache<
    string,
    { movementDistance: number; canReach: boolean; directDistance: number }
  >(500)

  // A* pathfinding algorithm for hex grids
  static findPath(
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

  // Find shortest path distance considering obstacles
  static findPathDistance(
    start: Hex,
    goal: Hex,
    getTile: (hex: Hex) => GridTile | undefined,
    canTraverse: (tile: GridTile) => boolean,
  ): number | null {
    const path = this.findPath(start, goal, getTile, canTraverse)
    return path ? path.length - 1 : null // Subtract 1 to get number of steps
  }

  // Default traversal function - allows movement through all tiles except blocked ones
  static defaultCanTraverse(tile: GridTile): boolean {
    // Cannot traverse through blocked tiles
    return tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE
  }

  /**
   * Calculate effective movement distance considering character range.
   * Characters can attack without moving if target is within range, bypassing blocked tiles.
   * Returns movement tiles needed (0 if already in range) rather than total path distance.
   */
  static calculateEffectiveDistance(
    start: Hex,
    goal: Hex,
    range: number,
    getTile: (hex: Hex) => GridTile | undefined,
    canTraverse: (tile: GridTile) => boolean,
    cachingEnabled: boolean = false,
  ): { movementDistance: number; canReach: boolean; directDistance: number } {
    // Check cache first if caching is enabled
    if (cachingEnabled) {
      const cacheKey = generatePathCacheKey(start.getId(), goal.getId(), range)
      const cached = this.effectiveDistanceCache.get(cacheKey)
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
        this.effectiveDistanceCache.set(cacheKey, result)
      }
      return result
    }

    // Need to move closer - find path to get within range
    const path = this.findPath(start, goal, getTile, canTraverse)

    if (!path) {
      // No path exists, cannot reach target
      const result = { movementDistance: Infinity, canReach: false, directDistance }
      if (cachingEnabled) {
        const cacheKey = generatePathCacheKey(start.getId(), goal.getId(), range)
        this.effectiveDistanceCache.set(cacheKey, result)
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
      this.effectiveDistanceCache.set(cacheKey, result)
    }
    return result
  }

  /**
   * Clear all caches - should be called when grid state changes significantly
   */
  static clearCache(): void {
    this.pathCache.clear()
    this.effectiveDistanceCache.clear()
  }
}
