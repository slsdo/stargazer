export interface CharacterType {
  id: string
  type: string
  level: string
  faction: string
  class: string
  damage: string
  season: string
  sourceHexId?: number // Optional property for tracking drag source
  team?: 'Self' | 'Enemy' // Team assignment for placement
}
