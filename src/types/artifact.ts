export interface ArtifactType {
  id: string
  season: number
  team?: 'Ally' | 'Enemy' // Team assignment for placement
}
