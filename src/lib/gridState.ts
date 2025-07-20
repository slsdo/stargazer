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
