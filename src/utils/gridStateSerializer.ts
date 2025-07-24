import type { GridTile } from '../lib/grid'
import type { Team } from '../lib/types/team'

/* Represents the minimal state needed to reconstruct a grid configuration */
export interface GridState {
  version: number
  map: string
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
  currentMap: string,
  tilesWithCharacters: GridTile[],
  allyArtifact: string | null,
  enemyArtifact: string | null,
): GridState {
  const characters = tilesWithCharacters
    .filter((tile) => tile.character && tile.team !== undefined)
    .map((tile) => ({
      hexId: tile.hex.getId(),
      characterId: tile.character!,
      team: tile.team!,
    }))

  return {
    version: 1, // For future compatibility
    map: currentMap,
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
    typeof state.map === 'string' &&
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
