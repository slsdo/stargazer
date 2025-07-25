import { serializeGridState, validateGridState, type GridState } from './gridStateSerializer'
import type { GridTile } from '../lib/grid'

export function encodeGridStateToUrl(gridState: GridState): string {
  try {
    // Convert to JSON and compress by removing whitespace
    const jsonString = JSON.stringify(gridState)

    // Base64 encode for URL safety
    const encoded = btoa(jsonString)

    return encoded
  } catch (error) {
    console.error('Failed to encode grid state:', error)
    throw new Error('Failed to encode grid state for sharing')
  }
}

export function decodeGridStateFromUrl(encodedState: string): GridState | null {
  try {
    // Base64 decode
    const jsonString = atob(encodedState)

    // Parse JSON
    const state = JSON.parse(jsonString)

    // Validate structure
    if (!validateGridState(state)) {
      console.warn('Invalid grid state structure in URL')
      return null
    }

    return state
  } catch (error) {
    console.warn('Failed to decode grid state from URL:', error)
    return null
  }
}

export function generateShareableUrl(
  allTiles: GridTile[],
  allyArtifact: string | null,
  enemyArtifact: string | null,
): string {
  const gridState = serializeGridState(allTiles, allyArtifact, enemyArtifact)

  const encodedState = encodeGridStateToUrl(gridState)

  // Generate full URL with current origin and path
  const baseUrl = `${window.location.origin}${window.location.pathname}`
  return `${baseUrl}?g=${encodedState}`
}

export function getGridStateFromCurrentUrl(): GridState | null {
  const urlParams = new URLSearchParams(window.location.search)
  const stateParam = urlParams.get('g')

  if (!stateParam) {
    return null
  }

  return decodeGridStateFromUrl(stateParam)
}

/* Uses replaceState to avoid creating new history entries */
export function updateUrlWithGridState(
  allTiles: GridTile[],
  allyArtifact: string | null,
  enemyArtifact: string | null,
): void {
  try {
    const shareableUrl = generateShareableUrl(allTiles, allyArtifact, enemyArtifact)

    // Update URL without triggering navigation
    window.history.replaceState({}, '', shareableUrl)
  } catch (error) {
    console.warn('Failed to update URL with grid state:', error)
  }
}
