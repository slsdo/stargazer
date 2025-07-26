import { Hex } from './hex'
import { ARENA_1 } from './arena/arena1'
import { State } from './types/state'
import { FULL_GRID, type GridPreset } from './constants'
import { Team } from './types/team'
import { clearPathfindingCache } from './pathfinding'

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
  characterId?: number
  team?: Team
}

export class Grid {
  private storage: Map<string, GridTile>
  private teamCharacters: Map<Team, Set<number>> = new Map([
    [Team.ALLY, new Set()],
    [Team.ENEMY, new Set()],
  ])
  private readonly MAX_TEAM_SIZE = 5
  readonly gridPreset: GridPreset

  constructor(layout = FULL_GRID, map = ARENA_1) {
    this.gridPreset = layout
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
    return Array.from(this.storage.values()).filter((tile) => tile.characterId !== undefined)
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

  canPlaceCharacter(characterId: number, team: Team): boolean {
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
    characterId: number,
    team: Team = Team.ALLY,
    skipCacheInvalidation: boolean = false,
  ): boolean {
    if (!this.canPlaceCharacterOnTile(hexOrId, team)) return false
    if (!this.canPlaceCharacter(characterId, team)) return false

    const tile = this.getTile(hexOrId)

    if (tile.characterId) {
      this.removeCharacterFromTeam(tile.characterId, tile.team)
    }

    this.setCharacterOnTile(tile, characterId, team)

    // Clear pathfinding caches when grid state changes
    if (!skipCacheInvalidation) {
      clearPathfindingCache()
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
    if (tile.characterId) {
      const characterId = tile.characterId
      const team = tile.team

      this.removeCharacterFromTeam(characterId, team)
      this.clearCharacterFromTile(tile, hexOrId)

      // Clear pathfinding caches when grid state changes
      if (!skipCacheInvalidation) {
        clearPathfindingCache()
      }
    }
  }

  getCharacter(hexOrId: Hex | number): number | undefined {
    return this.getTile(hexOrId).characterId
  }

  hasCharacter(hexOrId: Hex | number): boolean {
    return this.getTile(hexOrId).characterId !== undefined
  }

  getCharacterPlacements(): Map<number, number> {
    const placements = new Map<number, number>()
    for (const entry of this.storage.values()) {
      if (entry.characterId) {
        placements.set(entry.hex.getId(), entry.characterId)
      }
    }
    return placements
  }

  clearAllCharacters(): void {
    for (const entry of this.storage.values()) {
      if (entry.characterId) {
        this.clearCharacterFromTile(entry, entry.hex.getId())
      }
    }
    this.teamCharacters.get(Team.ALLY)?.clear()
    this.teamCharacters.get(Team.ENEMY)?.clear()

    // Clear pathfinding caches when grid state changes
    clearPathfindingCache()
  }

  getCharacterTeam(hexOrId: Hex | number): Team | undefined {
    return this.getTile(hexOrId).team
  }

  getCharacterCount(): number {
    let count = 0
    for (const entry of this.storage.values()) {
      if (entry.characterId) {
        count++
      }
    }
    return count
  }

  private removeCharacterFromTeam(characterId: number, team: Team | undefined): void {
    if (team !== undefined) {
      this.teamCharacters.get(team)?.delete(characterId)
    }
  }

  private setCharacterOnTile(tile: GridTile, characterId: number, team: Team): void {
    tile.characterId = characterId
    tile.team = team
    tile.state = team === Team.ALLY ? State.OCCUPIED_ALLY : State.OCCUPIED_ENEMY
    this.teamCharacters.get(team)?.add(characterId)
  }

  private clearCharacterFromTile(tile: GridTile, hexOrId: Hex | number): void {
    delete tile.characterId
    delete tile.team
    tile.state = this.getOriginalTileState(hexOrId)
  }
}
