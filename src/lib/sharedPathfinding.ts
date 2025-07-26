import { Hex } from './hex'
import { Pathfinding } from './pathfinding'
import { FULL_GRID, type GridPreset } from './constants'
import type { GridTile } from './grid'

/**
 * Shared pathfinding utilities used by both main grid calculations and debug visualization.
 * 
 * This module provides a single source of truth for target selection logic, ensuring that
 * both the rendered arrows and debug dashed lines show identical targets. The implementation
 * handles both ranged units (range > 1) and melee units (range = 1) with comprehensive
 * tie-breaking rules.
 * 
 * Key Features:
 * - Optimized BFS pathfinding for ranged units
 * - Individual target pathfinding for melee units  
 * - Comprehensive tie-breaking rules with proper row detection
 * - Grid preset integration for accurate spatial relationships
 */

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
): { hexId: number; distance: number } | null {
  if (targetTiles.length === 0) {
    return null
  }

  // For ranged units (range > 1), use optimized ranged movement calculation
  if (sourceRange > 1) {
    const targetHexes = targetTiles.map(tile => tile.hex)
    const rangedResult = Pathfinding.calculateRangedMovementDistance(
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
  let closest: { hexId: number; distance: number } | null = null

  for (const targetTile of targetTiles) {
    const canTraverseToTarget = (tile: GridTile) => {
      if (tile.hex.equals(targetTile.hex)) {
        return true
      }
      return canTraverse(tile)
    }

    // Use range-aware pathfinding
    const effectiveDistance = Pathfinding.calculateEffectiveDistance(
      sourceTile.hex,
      targetTile.hex,
      sourceRange,
      getTile,
      canTraverseToTarget,
      cachingEnabled,
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