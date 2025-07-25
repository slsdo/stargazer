import type { GridTile } from '../lib/grid'
import type { Team } from '../lib/types/team'
import type { State } from '../lib/types/state'

/* Represents the minimal state needed to reconstruct a grid configuration */
export interface GridState {
  version: number
  tiles: Array<{
    hexId: number
    state: State
  }>
  characters: Array<{
    hexId: number
    characterId: string
    team: Team
  }>
  artifacts: {
    ally: string | null
    enemy: string | null
  }
}

export function serializeGridState(
  allTiles: GridTile[],
  allyArtifact: string | null,
  enemyArtifact: string | null,
): GridState {
  // Serialize ALL tiles as they currently appear
  const tiles = allTiles.map((tile) => ({
    hexId: tile.hex.getId(),
    state: tile.state,
  }))

  // Extract characters from tiles that have them
  const characters = allTiles
    .filter((tile) => tile.character && tile.team !== undefined)
    .map((tile) => ({
      hexId: tile.hex.getId(),
      characterId: tile.character!,
      team: tile.team!,
    }))

  return {
    version: 2, // Increment version for new format
    tiles,
    characters,
    artifacts: {
      ally: allyArtifact,
      enemy: enemyArtifact,
    },
  }
}

export function validateGridState(state: any): state is GridState {
  return (
    typeof state === 'object' &&
    state !== null &&
    typeof state.version === 'number' &&
    Array.isArray(state.tiles) &&
    state.tiles.every(
      (tile: any) => typeof tile.hexId === 'number' && typeof tile.state === 'number',
    ) &&
    Array.isArray(state.characters) &&
    state.characters.every(
      (char: any) =>
        typeof char.hexId === 'number' &&
        typeof char.characterId === 'string' &&
        typeof char.team === 'number',
    ) &&
    typeof state.artifacts === 'object' &&
    state.artifacts !== null &&
    (state.artifacts.ally === null || typeof state.artifacts.ally === 'string') &&
    (state.artifacts.enemy === null || typeof state.artifacts.enemy === 'string')
  )
}
