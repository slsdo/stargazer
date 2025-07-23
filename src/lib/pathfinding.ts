import { Hex } from './hex'
import { State } from './types/state'
import type { GridTile } from './grid'

interface PathNode {
  hex: Hex
  g: number // Cost from start to this node
  h: number // Heuristic (estimated cost to goal)
  f: number // Total cost (g + h)
  parent: PathNode | null
}

export class Pathfinding {
  // A* pathfinding algorithm for hex grids
  static findPath(
    start: Hex,
    goal: Hex,
    getTile: (hex: Hex) => GridTile | undefined,
    canTraverse: (tile: GridTile) => boolean,
  ): Hex[] | null {
    const openSet: PathNode[] = []
    const closedSet = new Set<string>()

    // Create start node
    const startNode: PathNode = {
      hex: start,
      g: 0,
      h: start.distance(goal),
      f: start.distance(goal),
      parent: null,
    }

    openSet.push(startNode)

    while (openSet.length > 0) {
      // Find node with lowest f score
      let currentIndex = 0
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i
        }
      }

      const current = openSet.splice(currentIndex, 1)[0]

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
        // Skip if already evaluated
        if (closedSet.has(neighbor.toString())) {
          continue
        }

        // Skip if not traversable
        const tile = getTile(neighbor)
        if (!tile || !canTraverse(tile)) {
          continue
        }

        // Calculate tentative g score
        const tentativeG = current.g + 1

        // Check if neighbor is already in open set
        let neighborNode = openSet.find((n) => n.hex.equals(neighbor))

        if (!neighborNode) {
          // Create new node
          neighborNode = {
            hex: neighbor,
            g: tentativeG,
            h: neighbor.distance(goal),
            f: tentativeG + neighbor.distance(goal),
            parent: current,
          }
          openSet.push(neighborNode)
        } else if (tentativeG < neighborNode.g) {
          // Update existing node if we found a better path
          neighborNode.g = tentativeG
          neighborNode.f = tentativeG + neighborNode.h
          neighborNode.parent = current
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
  ): { movementDistance: number; canReach: boolean; directDistance: number } {
    // Calculate direct hex distance (ignoring obstacles)
    const directDistance = start.distance(goal)
    
    // If target is within range, no movement needed
    if (directDistance <= range) {
      return { movementDistance: 0, canReach: true, directDistance }
    }
    
    // Need to move closer - find path to get within range
    const path = this.findPath(start, goal, getTile, canTraverse)
    
    if (!path) {
      // No path exists, cannot reach target
      return { movementDistance: Infinity, canReach: false, directDistance }
    }
    
    // Calculate how many tiles we need to move to get within range
    const pathLength = path.length - 1 // Subtract 1 because path includes start position
    const movementNeeded = Math.max(0, pathLength - range)
    
    return { 
      movementDistance: movementNeeded, 
      canReach: true,
      directDistance 
    }
  }
}
