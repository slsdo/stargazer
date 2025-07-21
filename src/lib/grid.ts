import { Hex } from './hex'
import { ARENA_1 } from './arena/arena1'
import { State, DEFAULT_GRID, type GridPreset } from './constants'

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
  team?: 'Self' | 'Enemy'
}

export class Grid {
  private storage: Map<string, GridTile>
  private teamCharacters: Map<'Self' | 'Enemy', Set<string>> = new Map([
    ['Self', new Set()],
    ['Enemy', new Set()],
  ])
  private readonly MAX_TEAM_SIZE = 5

  constructor(layout = DEFAULT_GRID, map = ARENA_1) {
    this.storage = new Map()
    iniGrid(layout).forEach((hex) => {
      this.storage.set(Grid.key(hex), { hex, state: State.DEFAULT })
    })
    map.forEach((mapState) => {
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
  getAvailableSelf(): number {
    return this.getAvailableForTeam('Self')
  }

  getAvailableEnemy(): number {
    return this.getAvailableForTeam('Enemy')
  }

  private getAvailableForTeam(team: 'Self' | 'Enemy'): number {
    return this.MAX_TEAM_SIZE - (this.teamCharacters.get(team)?.size || 0)
  }

  canPlaceCharacter(characterId: string, team: 'Self' | 'Enemy'): boolean {
    // Check if team has space
    if (this.getAvailableForTeam(team) <= 0) return false

    // Check if character is already on the same team
    return !this.teamCharacters.get(team)?.has(characterId)
  }

  canPlaceCharacterOnTile(hexOrId: Hex | number, team: 'Self' | 'Enemy'): boolean {
    const tile = this.getTile(hexOrId)
    const state = tile.state
    const availableState = team === 'Self' ? State.AVAILABLE_SELF : State.AVAILABLE_ENEMY
    const occupiedState = team === 'Self' ? State.OCCUPIED_SELF : State.OCCUPIED_ENEMY

    return state === availableState || state === occupiedState
  }

  /**
   * Place a character on a hex tile
   */
  placeCharacter(
    hexOrId: Hex | number,
    characterId: string,
    team: 'Self' | 'Enemy' = 'Self',
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
    if (currentState === State.OCCUPIED_SELF) {
      return State.AVAILABLE_SELF
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
    this.teamCharacters.get('Self')?.clear()
    this.teamCharacters.get('Enemy')?.clear()
  }

  /**
   * Get team of a character on a hex tile
   */
  getCharacterTeam(hexOrId: Hex | number): 'Self' | 'Enemy' | undefined {
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

  // Consolidated character operation methods
  private removeCharacterFromTeam(characterId: string, team: 'Self' | 'Enemy' | undefined): void {
    if (team) {
      this.teamCharacters.get(team)?.delete(characterId)
    }
  }

  private setCharacterOnTile(tile: GridTile, characterId: string, team: 'Self' | 'Enemy'): void {
    tile.character = characterId
    tile.team = team
    tile.state = team === 'Self' ? State.OCCUPIED_SELF : State.OCCUPIED_ENEMY
    this.teamCharacters.get(team)?.add(characterId)
  }

  private clearCharacterFromTile(tile: GridTile, hexOrId: Hex | number): void {
    delete tile.character
    delete tile.team
    tile.state = this.getOriginalTileState(hexOrId)
  }
}
