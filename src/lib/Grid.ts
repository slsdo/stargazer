import { Hex } from './Hex'

// Enum for grid tile states
export enum State {
  DEFAULT = 0,
  AVAILABLE_SELF = 1, // Available for placement for self
  AVAILABLE_ENEMY = 2, // Available for placement for enemy
  OCCUPIED_SELF = 3, // Occupied by self unit
  OCCUPIED_ENEMY = 4, // Occupied by enemy unit
  BLOCKED = 5, // Blocked by obstacle
  BLOCKED_BREAKABLE = 6, // Blocked by breakable obstacle
}

export interface GridPreset {
  hex: number[][]
  qOffset: number[]
}

const FLAT_GRID: GridPreset = {
  hex: [
    [44, 41],
    [45, 42, 39, 36, 32],
    [43, 40, 37, 33, 29, 25],
    [38, 34, 30, 26, 22, 18],
    [35, 31, 27, 23, 19, 15, 11],
    [28, 24, 20, 16, 12, 8],
    [21, 17, 13, 9, 6, 3],
    [14, 10, 7, 4, 1],
    [5, 2],
  ],
  qOffset: [1, -1, -2, -2, -3, -3, -3, -3, -2],
}

const DEFAULT_GRID: GridPreset = {
  hex: [
    [43, 45],
    [35, 38, 40, 42, 44],
    [28, 31, 34, 37, 39, 41],
    [21, 24, 27, 30, 33, 36],
    [14, 17, 20, 23, 26, 29, 32],
    [10, 13, 16, 19, 22, 25],
    [5, 7, 9, 12, 15, 18],
    [2, 4, 6, 8, 11],
    [1, 3],
  ],
  qOffset: [2, 0, -1, -2, -3, -3, -4, -4, -3],
}

const ARENA_1 = [
  { type: State.AVAILABLE_SELF, hex: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
  { type: State.AVAILABLE_ENEMY, hex: [12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26] },
]

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
    const entry = this.storage.get(Grid.key(hex))
    if (entry) {
      entry.state = state
    }
  }

  getState(hex: Hex): State | undefined {
    return this.storage.get(Grid.key(hex))?.state
  }

  getHex(hex: Hex): Hex | undefined {
    return this.storage.get(Grid.key(hex))?.hex
  }

  has(hex: Hex): boolean {
    return this.storage.has(Grid.key(hex))
  }

  keys(): Hex[] {
    return Array.from(this.storage.values()).map((entry) => entry.hex)
  }

  values(): State[] {
    return Array.from(this.storage.values()).map((entry) => entry.state)
  }

  entries(): Array<{ hex: Hex; value: State }> {
    return Array.from(this.storage.values()).map((entry) => ({
      hex: entry.hex,
      value: entry.state,
    }))
  }

  // Helper method to get hex by ID
  getHexById(id: number): Hex {
    const hex = Array.from(this.storage.values()).find((entry) => entry.hex.getId() === id)?.hex
    if (!hex) throw new Error(`Hex with ID ${id} not found`)
    return hex
  }

  // Calculate curved arrow path between two hex IDs
  getArrowPath(startId: number, endId: number, layout: any): string {
    const startHex = this.getHexById(startId)
    const endHex = this.getHexById(endId)

    const start = layout.hexToPixel(startHex)
    const end = layout.hexToPixel(endHex)

    // Calculate control point for curve (offset perpendicular to line)
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2
    const dx = end.x - start.x
    const dy = end.y - start.y
    const length = Math.sqrt(dx * dx + dy * dy)
    const curvature = length * 0.3 // Adjust curve intensity

    // Perpendicular offset for control point
    const controlX = midX - (dy / length) * curvature
    const controlY = midY + (dx / length) * curvature

    return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`
  }

  // Character management methods
  placeCharacter(hex: Hex, characterId: string): void {
    const entry = this.storage.get(Grid.key(hex))
    if (entry) {
      entry.character = characterId
      entry.state = State.OCCUPIED_SELF
    }
  }

  placeCharacterById(hexId: number, characterId: string): void {
    const hex = this.getHexById(hexId)
    this.placeCharacter(hex, characterId)
  }

  removeCharacter(hex: Hex): void {
    const entry = this.storage.get(Grid.key(hex))
    if (entry) {
      delete entry.character
      entry.state = State.DEFAULT
    }
  }

  removeCharacterById(hexId: number): void {
    const hex = this.getHexById(hexId)
    this.removeCharacter(hex)
  }

  getCharacter(hex: Hex): string | undefined {
    return this.storage.get(Grid.key(hex))?.character
  }

  getCharacterById(hexId: number): string | undefined {
    const hex = this.getHexById(hexId)
    return this.getCharacter(hex)
  }

  hasCharacter(hex: Hex): boolean {
    return this.getCharacter(hex) !== undefined
  }

  hasCharacterById(hexId: number): boolean {
    return this.getCharacterById(hexId) !== undefined
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

  // Get GridTile by hex
  getTile(hex: Hex): GridTile | undefined {
    return this.storage.get(Grid.key(hex))
  }

  // Get GridTile by hex ID
  getTileById(hexId: number): GridTile | undefined {
    return Array.from(this.storage.values()).find((tile) => tile.hex.getId() === hexId)
  }

  // Get all GridTiles
  getAllTiles(): GridTile[] {
    return Array.from(this.storage.values())
  }

  // Get tiles with characters
  getTilesWithCharacters(): GridTile[] {
    return Array.from(this.storage.values()).filter((tile) => tile.character !== undefined)
  }
}
