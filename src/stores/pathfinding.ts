import { defineStore } from 'pinia'
import { computed } from 'vue'
import { Pathfinding } from '../lib/pathfinding'
import { Team } from '../lib/types/team'
import { State } from '../lib/types/state'
import type { Hex } from '../lib/hex'
import type { GridTile } from '../lib/grid'
import { useGridStore } from './grid'
import { useCharacterStore } from './character'
import { useGameDataStore } from './gameData'

export const usePathfindingStore = defineStore('pathfinding', () => {
  const gridStore = useGridStore()
  const characterStore = useCharacterStore()
  const gameDataStore = useGameDataStore()

  // Lazy evaluation for expensive computations - only compute when accessed
  const closestEnemyMap = computed(() => {
    const grid = gridStore._getGrid()
    // Convert readonly Map to mutable Map for Grid methods
    const characterRanges = new Map(gameDataStore.characterRanges)
    return grid.getClosestEnemyMap(characterRanges)
  })

  const closestAllyMap = computed(() => {
    const grid = gridStore._getGrid()
    // Convert readonly Map to mutable Map for Grid methods
    const characterRanges = new Map(gameDataStore.characterRanges)
    return grid.getClosestAllyMap(characterRanges)
  })

  // Debug pathfinding results for visualization
  const debugPathfindingResults = computed(() => {
    const grid = gridStore._getGrid()

    // Only compute when there are characters on the grid
    if (characterStore.charactersPlaced === 0) {
      return []
    }

    const results: Array<{ fromHexId: number; toHexId: number; path: Hex[]; team: Team }> = []
    const tilesWithCharacters = characterStore.getTilesWithCharacters()
    const allyTiles = tilesWithCharacters.filter((tile) => tile.team === Team.ALLY)
    const enemyTiles = tilesWithCharacters.filter((tile) => tile.team === Team.ENEMY)

    // Safe getTile helper - returns undefined for out-of-bounds hexes during pathfinding
    const getTileHelper = (hex: Hex) => {
      try {
        return grid.getTile(hex)
      } catch {
        return undefined
      }
    }

    // Helper function to find closest target
    const findClosestTarget = (
      sourceTile: GridTile,
      targetTiles: GridTile[],
      sourceRange: number,
      canTraverse: (tile: GridTile) => boolean,
    ): { hexId: number; distance: number } | null => {
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
          getTileHelper,
          canTraverseToTarget,
          false, // Don't use caching for debug
        )

        if (!effectiveDistance.canReach) {
          continue
        }

        // Use movement distance for comparison (tiles needed to move)
        const distance = effectiveDistance.movementDistance

        if (
          !closest ||
          distance < closest.distance ||
          (distance === closest.distance && targetTile.hex.getId() < closest.hexId)
        ) {
          closest = {
            hexId: targetTile.hex.getId(),
            distance: distance,
          }
        }
      }

      return closest
    }

    // Get paths from allies to closest enemies
    for (const allyTile of allyTiles) {
      const range = allyTile.character
        ? (gameDataStore.getCharacterRange(allyTile.character) ?? 1)
        : 1
      const closestEnemy = findClosestTarget(
        allyTile,
        enemyTiles,
        range,
        (tile) => tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE,
      )

      if (closestEnemy) {
        const targetTile = enemyTiles.find((t) => t.hex.getId() === closestEnemy.hexId)
        if (targetTile) {
          const path = Pathfinding.findPath(
            allyTile.hex,
            targetTile.hex,
            getTileHelper,
            (tile) => tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE,
          )
          if (path) {
            results.push({
              fromHexId: allyTile.hex.getId(),
              toHexId: closestEnemy.hexId,
              path,
              team: Team.ALLY,
            })
          }
        }
      }
    }

    // Get paths from enemies to closest allies
    for (const enemyTile of enemyTiles) {
      const range = enemyTile.character
        ? (gameDataStore.getCharacterRange(enemyTile.character) ?? 1)
        : 1
      const closestAlly = findClosestTarget(
        enemyTile,
        allyTiles,
        range,
        (tile) => tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE,
      )

      if (closestAlly) {
        const targetTile = allyTiles.find((t) => t.hex.getId() === closestAlly.hexId)
        if (targetTile) {
          const path = Pathfinding.findPath(
            enemyTile.hex,
            targetTile.hex,
            getTileHelper,
            (tile) => tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE,
          )
          if (path) {
            results.push({
              fromHexId: enemyTile.hex.getId(),
              toHexId: closestAlly.hexId,
              path,
              team: Team.ENEMY,
            })
          }
        }
      }
    }

    return results
  })

  return {
    // Computed pathfinding data
    closestEnemyMap,
    closestAllyMap,
    debugPathfindingResults,
  }
})
