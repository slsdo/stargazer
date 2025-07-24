import { serializeGridState, validateGridState, type GridState } from './gridStateSerializer'
import type { GridTile } from '../lib/grid'

/**
 * Encodes grid state into a compact URL-safe string using base64 and compression
 */
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

/**
 * Decodes a URL-encoded grid state string back to GridState object
 */
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

/**
 * Generates a complete shareable URL with the current grid state
 */
export function generateShareableUrl(
  currentMap: string,
  tilesWithCharacters: GridTile[],
  allyArtifact: string | null,
  enemyArtifact: string | null,
): string {
  const gridState = serializeGridState(currentMap, tilesWithCharacters, allyArtifact, enemyArtifact)

  const encodedState = encodeGridStateToUrl(gridState)

  // Generate full URL with current origin and path
  const baseUrl = `${window.location.origin}${window.location.pathname}`
  return `${baseUrl}?g=${encodedState}`
}

/**
 * Extracts grid state from current URL parameters
 */
export function getGridStateFromCurrentUrl(): GridState | null {
  const urlParams = new URLSearchParams(window.location.search)
  const stateParam = urlParams.get('g')

  if (!stateParam) {
    return null
  }

  return decodeGridStateFromUrl(stateParam)
}

/**
 * Updates the current URL with grid state (for browser history)
 * Uses replaceState to avoid creating new history entries
 */
export function updateUrlWithGridState(
  currentMap: string,
  tilesWithCharacters: GridTile[],
  allyArtifact: string | null,
  enemyArtifact: string | null,
): void {
  try {
    const shareableUrl = generateShareableUrl(
      currentMap,
      tilesWithCharacters,
      allyArtifact,
      enemyArtifact,
    )

    // Update URL without triggering navigation
    window.history.replaceState({}, '', shareableUrl)
  } catch (error) {
    console.warn('Failed to update URL with grid state:', error)
  }
}
