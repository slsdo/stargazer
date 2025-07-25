import { defineStore } from 'pinia'
import { State } from '../lib/types/state'
import { useGridStore } from './grid'
import { useCharacterStore } from './character'

export const useMapEditorStore = defineStore('mapEditor', () => {
  /**
   * Sets a hex to the specified state (used by map editor)
   * Removes any existing character and resets the tile completely
   */
  const setHexState = (hexId: number, state: State): boolean => {
    const gridStore = useGridStore()
    const characterStore = useCharacterStore()

    const hex = gridStore.getHexById(hexId)
    if (!hex) return false

    const tile = gridStore.getTile(hexId)

    // Remove character if hex is occupied
    if (tile.state === State.OCCUPIED_ALLY || tile.state === State.OCCUPIED_ENEMY) {
      characterStore.removeCharacterFromHex(hexId)
    }

    // Set the new state
    gridStore.setState(hex, state)
    return true
  }

  /**
   * Resets all hexes to DEFAULT state (used by "Clear Map" button)
   * Removes all characters and resets all tiles completely
   */
  const clearAllHexStates = () => {
    const gridStore = useGridStore()
    const characterStore = useCharacterStore()

    // Clear all characters first
    characterStore.clearAllCharacters()

    // Reset all hexes to default state
    for (const hex of gridStore.hexes) {
      gridStore.setState(hex, State.DEFAULT)
    }
  }

  const resetToCurrentMap = () => {
    const gridStore = useGridStore()
    const characterStore = useCharacterStore()

    // Clear all characters first
    characterStore.clearAllCharacters()

    // Get the current map configuration
    const mapConfig = gridStore.getCurrentMapConfig()
    if (!mapConfig) return

    // Reset all hexes to default first
    for (const hex of gridStore.hexes) {
      gridStore.setState(hex, State.DEFAULT)
    }

    // Apply the original map states
    mapConfig.grid.forEach((mapState) => {
      mapState.hex.forEach((hexId) => {
        const hex = gridStore.getHexById(hexId)
        gridStore.setState(hex, mapState.type)
      })
    })
  }

  return {
    // Actions
    setHexState,
    clearAllHexStates,
    resetToCurrentMap,
  }
})
