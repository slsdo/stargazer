import { Team } from './team'

export interface CharacterType {
  id: number
  name: string
  type: string
  level: string
  faction: string
  class: string
  damage: string
  range: number
  season: number
  sourceHexId?: number // Optional property for tracking drag source
  team?: Team // Team assignment for placement
}
