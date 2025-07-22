import { Hex } from './hex'
import { ARENA_1 } from './arena/arena1'
import { State, FULL_GRID, type GridPreset } from './constants'
import { Pathfinding } from './pathfinding'

function iniGrid(preset: GridPreset): Hex[] {
  const centerRowIndex = Math.floor(preset.hex.length / 2) // Default=4
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
  team?: 'Ally' | 'Enemy'
}

export class Grid {
  private storage: Map<string, GridTile>
  private teamCharacters: Map<'Ally' | 'Enemy', Set<string>> = new Map([
    ['Ally', new Set()],
    ['Enemy', new Set()],
  ])
  private readonly MAX_TEAM_SIZE = 5

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

  /**
   * Resolve a Hex or hexId to a Hex object
   */
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

  // Helper method to get hex by ID
  getHexById(id: number): Hex {
    const hex = Array.from(this.storage.values()).find((entry) => entry.hex.getId() === id)?.hex
    if (!hex) throw new Error(`Hex with ID ${id} not found`)
    return hex
  }

  /**
   * Get GridTile by hex or hexId
   */
  getTile(hexOrId: Hex | number): GridTile {
    const hex = this.resolveHex(hexOrId)
    const tile = this.storage.get(Grid.key(hex))
    if (!tile) throw new Error(`Tile with hex key ${Grid.key(hex)} not found`)
    return tile
  }

  // Get all GridTiles
  getAllTiles(): GridTile[] {
    return Array.from(this.storage.values())
  }

  // Get tiles with characters
  getTilesWithCharacters(): GridTile[] {
    return Array.from(this.storage.values()).filter((tile) => tile.character !== undefined)
  }

  // Team availability methods
  getAvailableAlly(): number {
    return this.getAvailableForTeam('Ally')
  }

  getAvailableEnemy(): number {
    return this.getAvailableForTeam('Enemy')
  }

  private getAvailableForTeam(team: 'Ally' | 'Enemy'): number {
    return this.MAX_TEAM_SIZE - (this.teamCharacters.get(team)?.size || 0)
  }

  canPlaceCharacter(characterId: string, team: 'Ally' | 'Enemy'): boolean {
    // Check if team has space
    if (this.getAvailableForTeam(team) <= 0) return false

    // Check if character is already on the same team
    return !this.teamCharacters.get(team)?.has(characterId)
  }

  canPlaceCharacterOnTile(hexOrId: Hex | number, team: 'Ally' | 'Enemy'): boolean {
    const tile = this.getTile(hexOrId)
    const state = tile.state
    const availableState = team === 'Ally' ? State.AVAILABLE_ALLY : State.AVAILABLE_ENEMY
    const occupiedState = team === 'Ally' ? State.OCCUPIED_ALLY : State.OCCUPIED_ENEMY

    return state === availableState || state === occupiedState
  }

  /**
   * Place a character on a hex tile
   */
  placeCharacter(
    hexOrId: Hex | number,
    characterId: string,
    team: 'Ally' | 'Enemy' = 'Ally',
  ): boolean {
    // Check if tile allows this team
    if (!this.canPlaceCharacterOnTile(hexOrId, team)) return false

    // Check if character can be placed (team size and duplicate restrictions)
    if (!this.canPlaceCharacter(characterId, team)) return false

    const tile = this.getTile(hexOrId)

    // If there's already a character on this tile, remove it first
    if (tile.character) {
      this.removeCharacterFromTeam(tile.character, tile.team)
    }

    // Place the new character
    this.setCharacterOnTile(tile, characterId, team)

    return true
  }

  // Helper method to get original tile state (before character placement)
  private getOriginalTileState(hexOrId: Hex | number): State {
    // Check the arena configuration to see what this tile's original state should be
    const tile = this.getTile(hexOrId)
    const currentState = tile.state

    // If it's occupied, determine what it should be when empty
    if (currentState === State.OCCUPIED_ALLY) {
      return State.AVAILABLE_ALLY
    } else if (currentState === State.OCCUPIED_ENEMY) {
      return State.AVAILABLE_ENEMY
    }

    // For other states, return as is
    return currentState
  }

  /**
   * Remove a character from a hex tile
   */
  removeCharacter(hexOrId: Hex | number): void {
    const tile = this.getTile(hexOrId)
    if (tile.character) {
      const characterId = tile.character
      const team = tile.team

      this.removeCharacterFromTeam(characterId, team)
      this.clearCharacterFromTile(tile, hexOrId)
    }
  }

  /**
   * Get character on a hex tile
   */
  getCharacter(hexOrId: Hex | number): string | undefined {
    return this.getTile(hexOrId).character
  }

  /**
   * Check if a hex tile has a character
   */
  hasCharacter(hexOrId: Hex | number): boolean {
    return this.getTile(hexOrId).character !== undefined
  }

  // Get all character placements as a Map for compatibility
  getCharacterPlacements(): Map<number, string> {
    const placements = new Map<number, string>()
    for (const entry of this.storage.values()) {
      if (entry.character) {
        placements.set(entry.hex.getId(), entry.character)
      }
    }
    return placements
  }

  // Clear all characters
  clearAllCharacters(): void {
    for (const entry of this.storage.values()) {
      if (entry.character) {
        this.clearCharacterFromTile(entry, entry.hex.getId())
      }
    }
    this.teamCharacters.get('Ally')?.clear()
    this.teamCharacters.get('Enemy')?.clear()
  }

  /**
   * Get team of a character on a hex tile
   */
  getCharacterTeam(hexOrId: Hex | number): 'Ally' | 'Enemy' | undefined {
    return this.getTile(hexOrId).team
  }

  // Get count of placed characters
  getCharacterCount(): number {
    let count = 0
    for (const entry of this.storage.values()) {
      if (entry.character) {
        count++
      }
    }
    return count
  }

  /**
   * Traversal function for finding paths to enemies (allows moving through all non-blocked tiles)
   */
  private canTraverseToEnemy(tile: GridTile): boolean {
    // Only blocked tiles are impassable
    return tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE
  }
  
  /**
   * Traversal function for finding paths to allies (allows moving through all non-blocked tiles)
   */
  private canTraverseToAlly(tile: GridTile): boolean {
    // Only blocked tiles are impassable
    return tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE
  }

  /**
   * Find the closest target from a source tile among a list of target tiles
   * Uses A* pathfinding to account for obstacles
   * Tie-breaking: if multiple targets at same path distance, choose the one with lowest hex ID
   */
  private findClosestTarget(
    sourceTile: GridTile,
    targetTiles: GridTile[],
    canTraverse: (tile: GridTile) => boolean,
  ): { hexId: number; distance: number } | null {
    let closest: { hexId: number; distance: number } | null = null

    // Create a safe getTile helper that returns undefined for out-of-bounds hexes
    // The A* pathfinding algorithm explores all neighbors of each hex during pathfinding.
    // When hexes are near grid edges, some neighbors will be outside the grid bounds.
    // getTile() throws an error for non-existent hexes, so we catch these and return
    // undefined, which the pathfinding algorithm treats as impassable terrain.
    const getTileHelper = (hex: Hex) => {
      try {
        return this.getTile(hex)
      } catch {
        return undefined
      }
    }

    for (const targetTile of targetTiles) {
      // Create traversal function that allows destination tile
      const canTraverseToTarget = (tile: GridTile) => {
        // Always allow the target tile itself
        if (tile.hex.equals(targetTile.hex)) {
          return true
        }
        return canTraverse(tile)
      }

      // Calculate path distance using A* 
      const pathDistance = Pathfinding.findPathDistance(
        sourceTile.hex,
        targetTile.hex,
        getTileHelper,
        canTraverseToTarget
      )

      // Skip if no path exists
      if (pathDistance === null) {
        continue
      }

      // Update if this target is closer, or same distance with lower hex ID
      if (
        !closest ||
        pathDistance < closest.distance ||
        (pathDistance === closest.distance && targetTile.hex.getId() < closest.hexId)
      ) {
        closest = {
          hexId: targetTile.hex.getId(),
          distance: pathDistance,
        }
      }
    }

    return closest
  }

  /**
   * Calculate closest enemy for each ally character
   * Returns a map of ally hex IDs to their closest enemy info
   * Uses pathfinding to account for obstacles
   */
  getClosestEnemyMap(): Map<number, { enemyHexId: number; distance: number }> {
    const result = new Map<number, { enemyHexId: number; distance: number }>()

    // Get all tiles with characters
    const tilesWithCharacters = this.getTilesWithCharacters()
    const allyTiles = tilesWithCharacters.filter((tile) => tile.team === 'Ally')
    const enemyTiles = tilesWithCharacters.filter((tile) => tile.team === 'Enemy')

    // For each ally character, find closest enemy using pathfinding
    for (const allyTile of allyTiles) {
      const closestEnemy = this.findClosestTarget(allyTile, enemyTiles, (tile) => this.canTraverseToEnemy(tile))

      if (closestEnemy) {
        result.set(allyTile.hex.getId(), {
          enemyHexId: closestEnemy.hexId,
          distance: closestEnemy.distance,
        })
      }
    }

    return result
  }

  /**
   * Calculate closest ally character for each enemy
   * Returns a map of enemy hex IDs to their closest ally character info
   * Uses pathfinding to account for obstacles
   */
  getClosestAllyMap(): Map<number, { allyHexId: number; distance: number }> {
    const result = new Map<number, { allyHexId: number; distance: number }>()

    // Get all tiles with characters
    const tilesWithCharacters = this.getTilesWithCharacters()
    const allyTiles = tilesWithCharacters.filter((tile) => tile.team === 'Ally')
    const enemyTiles = tilesWithCharacters.filter((tile) => tile.team === 'Enemy')

    // For each enemy character, find closest ally character using pathfinding
    for (const enemyTile of enemyTiles) {
      const closestAlly = this.findClosestTarget(enemyTile, allyTiles, (tile) => this.canTraverseToAlly(tile))

      if (closestAlly) {
        result.set(enemyTile.hex.getId(), {
          allyHexId: closestAlly.hexId,
          distance: closestAlly.distance,
        })
      }
    }

    return result
  }

  // Consolidated character operation methods
  private removeCharacterFromTeam(characterId: string, team: 'Ally' | 'Enemy' | undefined): void {
    if (team) {
      this.teamCharacters.get(team)?.delete(characterId)
    }
  }

  private setCharacterOnTile(tile: GridTile, characterId: string, team: 'Ally' | 'Enemy'): void {
    tile.character = characterId
    tile.team = team
    tile.state = team === 'Ally' ? State.OCCUPIED_ALLY : State.OCCUPIED_ENEMY
    this.teamCharacters.get(team)?.add(characterId)
  }

  private clearCharacterFromTile(tile: GridTile, hexOrId: Hex | number): void {
    delete tile.character
    delete tile.team
    tile.state = this.getOriginalTileState(hexOrId)
  }
}
