import { Team } from './team'

export interface ArtifactType {
  id: string
  season: number
  team?: Team // Team assignment for placement
}
