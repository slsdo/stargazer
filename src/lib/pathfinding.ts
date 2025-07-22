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
}
