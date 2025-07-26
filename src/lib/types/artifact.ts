import { Team } from './team'

export interface ArtifactType {
  name: string
  season: number
  team?: Team // Team assignment for placement
}
