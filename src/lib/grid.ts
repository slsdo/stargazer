import { Hex } from './hex'
import { DEFAULT_GRID, type GridPreset } from './gridPreset'
import { ARENA_1 } from './arena/arena1'
import { State } from './gridState'

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
}

export class Grid {
  private storage: Map<string, GridTile>

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

  // Get GridTile by hex
  getTile(hex: Hex): GridTile {
    const tile = this.storage.get(Grid.key(hex))
    if (!tile) throw new Error(`Tile with hex key ${Grid.key(hex)} not found`)
    return tile
  }

  // Get GridTile by hex ID
  getTileById(hexId: number): GridTile {
    const tile = Array.from(this.storage.values()).find((tile) => tile.hex.getId() === hexId)
    if (!tile) throw new Error(`Tile with hex ID ${hexId} not found`)
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

  // Character management methods
  placeCharacter(hex: Hex, characterId: string): void {
    const tile = this.getTile(hex)
    if (tile) {
      tile.character = characterId
      tile.state = State.OCCUPIED_SELF
    }
  }

  placeCharacterById(hexId: number, characterId: string): void {
    const tile = this.getTileById(hexId)
    tile.character = characterId
    tile.state = State.OCCUPIED_SELF
  }

  removeCharacter(hex: Hex): void {
    const tile = this.getTile(hex)
    if (tile) {
      delete tile.character
      tile.state = State.DEFAULT
    }
  }

  removeCharacterById(hexId: number): void {
    const tile = this.getTileById(hexId)
    delete tile.character
    tile.state = State.DEFAULT
  }

  getCharacter(hex: Hex): string | undefined {
    return this.getTile(hex).character
  }

  getCharacterById(hexId: number): string | undefined {
    return this.getTileById(hexId).character
  }

  hasCharacter(hex: Hex): boolean {
    return this.getTile(hex).character !== undefined
  }

  hasCharacterById(hexId: number): boolean {
    return this.getTileById(hexId).character !== undefined
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
      delete entry.character
      entry.state = State.DEFAULT
    }
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
}
