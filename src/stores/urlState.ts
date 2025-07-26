import { defineStore } from 'pinia'
import { useGridStore } from './grid'
import { useCharacterStore } from './character'
import { useArtifactStore } from './artifact'
import { useStateReset } from '../composables/useStateReset'
import { Team } from '../lib/types/team'
import { getGridStateFromCurrentUrl } from '../utils/urlStateManager'

export const useUrlStateStore = defineStore('urlState', () => {
  // Store instances created once at store level
  const gridStore = useGridStore()
  const characterStore = useCharacterStore()
  const artifactStore = useArtifactStore()
  const { clearAllState } = useStateReset()

  // Restore grid state from URL parameters
  const restoreStateFromUrl = () => {
    try {
      const urlState = getGridStateFromCurrentUrl()
      if (!urlState) {
        return // No state in URL
      }

      // Clear existing state first using shared utility
      clearAllState()

      // Restore all tile states from the URL
      urlState.tiles.forEach(({ hexId, state }) => {
        try {
          const hex = gridStore.getHexById(hexId)
          gridStore.setState(hex, state)
        } catch (error) {
          console.warn(`Failed to restore tile state for hex ${hexId}:`, error)
        }
      })

      // Restore character placements
      urlState.characters.forEach(({ hexId, characterName, team }) => {
        const success = characterStore.placeCharacterOnHex(hexId, characterName, team)
        if (!success) {
          console.warn(`Failed to place character ${characterName} on hex ${hexId}`)
        }
      })

      // Restore artifacts
      if (urlState.artifacts.ally) {
        artifactStore.placeArtifact(urlState.artifacts.ally, Team.ALLY)
      }
      if (urlState.artifacts.enemy) {
        artifactStore.placeArtifact(urlState.artifacts.enemy, Team.ENEMY)
      }

      // URL state restoration completed successfully
    } catch (error) {
      console.error('Failed to restore state from URL:', error)
    }
  }

  return {
    restoreStateFromUrl,
  }
})
