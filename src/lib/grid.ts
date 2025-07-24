import { Hex } from './hex'
import { ARENA_1 } from './arena/arena1'
import { State } from './types/state'
import { FULL_GRID, type GridPreset } from './constants'
import { Pathfinding } from './pathfinding'
import { Team } from './types/team'
import { MemoCache, generateGridCacheKey } from './memoization'

function iniGrid(preset: GridPreset): Hex[] {
  const centerRowIndex = Math.floor(preset.hex.length / 2)
  const hexes: Hex[] = []

  for (let rowIndex = 0; rowIndex < preset.hex.length; rowIndex++) {
    const row = preset.hex[rowIndex]
    const r = rowIndex - centerRowIndex
    const offset = preset.qOffset[rowIndex]

    for (let i = 0; i < row.length; i++) {
      const q = offset + i
      const s = -q - r
      const id = row[i]
      hexes.push(new Hex(q, r, s, id))
    }
  }

  return hexes
}

export interface GridTile {
  hex: Hex
  state: State
  character?: string
  team?: Team
}

export class Grid {
  private storage: Map<string, GridTile>
  private teamCharacters: Map<Team, Set<string>> = new Map([
    [Team.ALLY, new Set()],
    [Team.ENEMY, new Set()],
  ])
  private readonly MAX_TEAM_SIZE = 5
  
  // Caches for expensive calculations
  private closestEnemyCache = new MemoCache<string, Map<number, { enemyHexId: number; distance: number }>>(100)
  private closestAllyCache = new MemoCache<string, Map<number, { allyHexId: number; distance: number }>>(100)
  
  // Caching configuration - set to false for debugging performance issues
  // When false, all pathfinding and grid calculations run without memoization
  private cachingEnabled = true

  constructor(layout = FULL_GRID, map = ARENA_1) {
    this.storage = new Map()
    iniGrid(layout).forEach((hex) => {
      this.storage.set(Grid.key(hex), { hex, state: State.DEFAULT })
    })
    map.grid.forEach((mapState) => {
      mapState.hex.forEach((hexId) => {
        const hex = this.getHexById(hexId)
        this.setState(hex, mapState.type)
      })
    })
  }

  private static key(hex: Hex): string {
    return `${hex.q},${hex.r},${hex.s}`
  }

  private resolveHex(hexOrId: Hex | number): Hex {
    if (typeof hexOrId === 'number') {
      return this.getHexById(hexOrId)
    }
    return hexOrId
  }

  setState(hex: Hex, state: State): void {
    const tile = this.getTile(hex)
    if (tile) {
      tile.state = state
    }
  }

  getState(hex: Hex): State {
    return this.getTile(hex).state
  }

  keys(): Hex[] {
    return Array.from(this.storage.values()).map((entry) => entry.hex)
  }

  getHexById(id: number): Hex {
    const hex = Array.from(this.storage.values()).find((entry) => entry.hex.getId() === id)?.hex
    if (!hex) throw new Error(`Hex with ID ${id} not found`)
    return hex
  }

  getTile(hexOrId: Hex | number): GridTile {
    const hex = this.resolveHex(hexOrId)
    const tile = this.storage.get(Grid.key(hex))
    if (!tile) throw new Error(`Tile with hex key ${Grid.key(hex)} not found`)
    return tile
  }

  getAllTiles(): GridTile[] {
    return Array.from(this.storage.values())
  }

  getTilesWithCharacters(): GridTile[] {
    return Array.from(this.storage.values()).filter((tile) => tile.character !== undefined)
  }

  getAvailableAlly(): number {
    return this.getAvailableForTeam(Team.ALLY)
  }

  getAvailableEnemy(): number {
    return this.getAvailableForTeam(Team.ENEMY)
  }

  private getAvailableForTeam(team: Team): number {
    return this.MAX_TEAM_SIZE - (this.teamCharacters.get(team)?.size || 0)
  }

  canPlaceCharacter(characterId: string, team: Team): boolean {
    if (this.getAvailableForTeam(team) <= 0) return false
    return !this.teamCharacters.get(team)?.has(characterId)
  }

  canPlaceCharacterOnTile(hexOrId: Hex | number, team: Team): boolean {
    const tile = this.getTile(hexOrId)
    const state = tile.state
    const availableState = team === Team.ALLY ? State.AVAILABLE_ALLY : State.AVAILABLE_ENEMY
    const occupiedState = team === Team.ALLY ? State.OCCUPIED_ALLY : State.OCCUPIED_ENEMY

    return state === availableState || state === occupiedState
  }

  placeCharacter(
    hexOrId: Hex | number, 
    characterId: string, 
    team: Team = Team.ALLY,
    skipCacheInvalidation: boolean = false
  ): boolean {
    if (!this.canPlaceCharacterOnTile(hexOrId, team)) return false
    if (!this.canPlaceCharacter(characterId, team)) return false

    const tile = this.getTile(hexOrId)

    if (tile.character) {
      this.removeCharacterFromTeam(tile.character, tile.team)
    }

    this.setCharacterOnTile(tile, characterId, team)
    
    // Only invalidate caches if not skipping invalidation
    if (!skipCacheInvalidation) {
      this.invalidateCaches()
    }

    return true
  }

  private getOriginalTileState(hexOrId: Hex | number): State {
    const tile = this.getTile(hexOrId)
    const currentState = tile.state

    if (currentState === State.OCCUPIED_ALLY) {
      return State.AVAILABLE_ALLY
    } else if (currentState === State.OCCUPIED_ENEMY) {
      return State.AVAILABLE_ENEMY
    }

    return currentState
  }

  removeCharacter(hexOrId: Hex | number, skipCacheInvalidation: boolean = false): void {
    const tile = this.getTile(hexOrId)
    if (tile.character) {
      const characterId = tile.character
      const team = tile.team

      this.removeCharacterFromTeam(characterId, team)
      this.clearCharacterFromTile(tile, hexOrId)
      
      // Only invalidate caches if not skipping invalidation
      if (!skipCacheInvalidation) {
        this.invalidateCaches()
      }
    }
  }

  getCharacter(hexOrId: Hex | number): string | undefined {
    return this.getTile(hexOrId).character
  }

  hasCharacter(hexOrId: Hex | number): boolean {
    return this.getTile(hexOrId).character !== undefined
  }

  getCharacterPlacements(): Map<number, string> {
    const placements = new Map<number, string>()
    for (const entry of this.storage.values()) {
      if (entry.character) {
        placements.set(entry.hex.getId(), entry.character)
      }
    }
    return placements
  }

  clearAllCharacters(): void {
    for (const entry of this.storage.values()) {
      if (entry.character) {
        this.clearCharacterFromTile(entry, entry.hex.getId())
      }
    }
    this.teamCharacters.get(Team.ALLY)?.clear()
    this.teamCharacters.get(Team.ENEMY)?.clear()
    
    // Invalidate caches when all characters are cleared
    this.invalidateCaches()
  }

  getCharacterTeam(hexOrId: Hex | number): Team | undefined {
    return this.getTile(hexOrId).team
  }

  getCharacterCount(): number {
    let count = 0
    for (const entry of this.storage.values()) {
      if (entry.character) {
        count++
      }
    }
    return count
  }

  /* Traversal function for finding paths to enemies (allows moving through all non-blocked tiles) */
  private canTraverseToEnemy(tile: GridTile): boolean {
    // Only blocked tiles are impassable
    return tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE
  }

  /* Traversal function for finding paths to allies (allows moving through all non-blocked tiles) */
  private canTraverseToAlly(tile: GridTile): boolean {
    // Only blocked tiles are impassable
    return tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE
  }

  /* Find the closest target from a source tile among a list of target tiles
   * Uses A* pathfinding to account for obstacles and character range
   * Tie-breaking: if multiple targets at same effective distance, choose the one with lowest hex ID */
  
  private findClosestTarget(
    sourceTile: GridTile,
    targetTiles: GridTile[],
    sourceRange: number,
    canTraverse: (tile: GridTile) => boolean,
  ): { hexId: number; distance: number } | null {
    let closest: { hexId: number; distance: number } | null = null

    // Safe getTile helper - returns undefined for out-of-bounds hexes during pathfinding
    const getTileHelper = (hex: Hex) => {
      try {
        return this.getTile(hex)
      } catch {
        return undefined
      }
    }

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
        this.cachingEnabled,
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

  /* Calculate closest enemy for each ally character
   * Returns a map of ally hex IDs to their closest enemy info
   * Uses pathfinding to account for obstacles and character range */
  
  getClosestEnemyMap(
    characterRanges: Map<string, number> = new Map(),
  ): Map<number, { enemyHexId: number; distance: number }> {
    // Generate cache key based on current grid state
    const tilesWithCharacters = this.getTilesWithCharacters()
    
    // Check cache first if caching is enabled
    // Cache key includes character positions and ranges for accurate memoization
    if (this.cachingEnabled) {
      const cacheKey = generateGridCacheKey(tilesWithCharacters, characterRanges)
      const cached = this.closestEnemyCache.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const result = new Map<number, { enemyHexId: number; distance: number }>()

    // Get all tiles with characters
    const allyTiles = tilesWithCharacters.filter((tile) => tile.team === Team.ALLY)
    const enemyTiles = tilesWithCharacters.filter((tile) => tile.team === Team.ENEMY)

    // For each ally character, find closest enemy using pathfinding
    for (const allyTile of allyTiles) {
      const range = allyTile.character ? (characterRanges.get(allyTile.character) ?? 1) : 1
      const closestEnemy = this.findClosestTarget(allyTile, enemyTiles, range, (tile) =>
        this.canTraverseToEnemy(tile),
      )

      if (closestEnemy) {
        result.set(allyTile.hex.getId(), {
          enemyHexId: closestEnemy.hexId,
          distance: closestEnemy.distance,
        })
      }
    }

    // Cache the result if caching is enabled
    if (this.cachingEnabled) {
      const cacheKey = generateGridCacheKey(tilesWithCharacters, characterRanges)
      this.closestEnemyCache.set(cacheKey, result)
    }
    return result
  }

  /* Calculate closest ally character for each enemy
   * Returns a map of enemy hex IDs to their closest ally character info
   * Uses pathfinding to account for obstacles and character range */
  
  getClosestAllyMap(
    characterRanges: Map<string, number> = new Map(),
  ): Map<number, { allyHexId: number; distance: number }> {
    // Generate cache key based on current grid state
    const tilesWithCharacters = this.getTilesWithCharacters()
    
    // Check cache first if caching is enabled
    if (this.cachingEnabled) {
      const cacheKey = generateGridCacheKey(tilesWithCharacters, characterRanges)
      const cached = this.closestAllyCache.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    const result = new Map<number, { allyHexId: number; distance: number }>()

    // Get all tiles with characters
    const allyTiles = tilesWithCharacters.filter((tile) => tile.team === Team.ALLY)
    const enemyTiles = tilesWithCharacters.filter((tile) => tile.team === Team.ENEMY)

    // For each enemy character, find closest ally character using pathfinding
    for (const enemyTile of enemyTiles) {
      const range = enemyTile.character ? (characterRanges.get(enemyTile.character) ?? 1) : 1
      const closestAlly = this.findClosestTarget(enemyTile, allyTiles, range, (tile) =>
        this.canTraverseToAlly(tile),
      )

      if (closestAlly) {
        result.set(enemyTile.hex.getId(), {
          allyHexId: closestAlly.hexId,
          distance: closestAlly.distance,
        })
      }
    }

    // Cache the result if caching is enabled
    if (this.cachingEnabled) {
      const cacheKey = generateGridCacheKey(tilesWithCharacters, characterRanges)
      this.closestAllyCache.set(cacheKey, result)
    }
    return result
  }

  private removeCharacterFromTeam(characterId: string, team: Team | undefined): void {
    if (team !== undefined) {
      this.teamCharacters.get(team)?.delete(characterId)
    }
  }

  private setCharacterOnTile(tile: GridTile, characterId: string, team: Team): void {
    tile.character = characterId
    tile.team = team
    tile.state = team === Team.ALLY ? State.OCCUPIED_ALLY : State.OCCUPIED_ENEMY
    this.teamCharacters.get(team)?.add(characterId)
  }

  private clearCharacterFromTile(tile: GridTile, hexOrId: Hex | number): void {
    delete tile.character
    delete tile.team
    tile.state = this.getOriginalTileState(hexOrId)
  }

  /**
   * Invalidate all caches - should be called when grid state changes
   */
  invalidateCaches(): void {
    this.closestEnemyCache.clear()
    this.closestAllyCache.clear()
    // Also clear pathfinding caches
    Pathfinding.clearCache()
  }



}
