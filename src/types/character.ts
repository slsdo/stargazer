export interface CharacterType {
  id: string
  type: string
  level: string
  faction: string
  class: string
  damage: string
  range: number
  season: number
  sourceHexId?: number // Optional property for tracking drag source
  team?: 'Ally' | 'Enemy' // Team assignment for placement
}
