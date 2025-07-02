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

// Default map grid

function defaultGrid(): Hex[] {
  const defaultMap = [
    [43, 45],
    [35, 38, 40, 42, 44],
    [28, 31, 34, 37, 39, 41],
    [21, 24, 27, 30, 33, 36],
    [14, 17, 20, 23, 26, 29, 32],
    [10, 13, 16, 19, 22, 25],
    [5, 7, 9, 12, 15, 18],
    [2, 4, 6, 8, 11],
    [1, 3],
  ]
  const centerRowIndex = Math.floor(defaultMap.length / 2) // Default=4
  // Offset pattern for q, to position the tiles
  const qOffset = [2, 0, -1, -2, -3, -3, -4, -4, -3]
  const hexes: Hex[] = []

  for (let rowIndex = 0; rowIndex < defaultMap.length; rowIndex++) {
    const row = defaultMap[rowIndex]
    const r = rowIndex - centerRowIndex
    const offset = qOffset[rowIndex]

    for (let i = 0; i < row.length; i++) {
      const q = offset + i
      const s = -q - r
      const id = row[i]
      hexes.push(new Hex(q, r, s, id))
    }
  }

  return hexes
}

export class Grid {
  private storage: Map<string, { hex: Hex; state: State }>

  constructor() {
    this.storage = new Map()
    for (const hex of defaultGrid()) {
      this.storage.set(Grid.key(hex), { hex, state: State.DEFAULT })
    }
  }

  private static key(hex: Hex): string {
    return `${hex.q},${hex.r},${hex.s}`
  }

  set(hex: Hex, state: State): void {
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

  delete(hex: Hex): void {
    this.storage.delete(Grid.key(hex))
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
  getHexById(id: number): Hex | undefined {
    return Array.from(this.storage.values()).find((entry) => entry.hex.getId() === id)?.hex
  }

  // Helper method to get all hexes sorted by ID
  getHexesSortedById(): Hex[] {
    return Array.from(this.storage.values())
      .map((entry) => entry.hex)
      .sort((a, b) => a.getId() - b.getId())
  }
}
