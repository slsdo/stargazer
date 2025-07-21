import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { Grid, type GridTile } from '../lib/grid'
import { Layout, POINTY } from '../lib/layout'
import type { Hex } from '../lib/hex'

export const useGridStore = defineStore('grid', () => {
  // Core grid instances
  const grid = new Grid()
  const gridOrigin = { x: 300, y: 300 }
  const layout = new Layout(POINTY, { x: 40, y: 40 }, gridOrigin)
  const hexes = grid.keys()

  // Reactive trigger for character updates
  const characterUpdateTrigger = ref(0)

  // Getters that read from Grid instance
  const totalHexes = computed(() => hexes.length)
  const charactersPlaced = computed(() => {
    characterUpdateTrigger.value // Reactivity trigger
    return grid.getCharacterCount()
  })
  const placedCharactersList = computed(() => {
    characterUpdateTrigger.value // Reactivity trigger
    return Array.from(grid.getCharacterPlacements().entries())
  })
  const characterPlacements = computed(() => {
    characterUpdateTrigger.value // Reactivity trigger
    return grid.getCharacterPlacements()
  })

  // Team availability getters
  const availableSelf = computed(() => {
    characterUpdateTrigger.value // Reactivity trigger
    return grid.getAvailableSelf()
  })

  const availableEnemy = computed(() => {
    characterUpdateTrigger.value // Reactivity trigger
    return grid.getAvailableEnemy()
  })

  // Actions that use Grid instance
  const placeCharacterOnHex = (
    hexId: number,
    characterId: string,
    team: 'Self' | 'Enemy' = 'Self',
  ): boolean => {
    console.log('Store: placing character on hex', hexId, characterId, 'team:', team)
    const success = grid.placeCharacter(hexId, characterId, team)
    if (success) {
      characterUpdateTrigger.value++ // Trigger reactivity
      console.log('Store: character placements now:', grid.getCharacterPlacements())
    } else {
      console.log('Store: placement failed - team restrictions or duplicate character')
    }
    return success
  }

  const removeCharacterFromHex = (hexId: number) => {
    grid.removeCharacter(hexId)
    characterUpdateTrigger.value++ // Trigger reactivity
  }

  const clearAllCharacters = () => {
    grid.clearAllCharacters()
    characterUpdateTrigger.value++ // Trigger reactivity
  }

  const getCharacterOnHex = (hexId: number): string | undefined => {
    return grid.getCharacter(hexId)
  }

  const isHexOccupied = (hexId: number): boolean => {
    return grid.hasCharacter(hexId)
  }

  const canPlaceCharacter = (characterId: string, team: 'Self' | 'Enemy'): boolean => {
    return grid.canPlaceCharacter(characterId, team)
  }

  const canPlaceCharacterOnTile = (hexId: number, team: 'Self' | 'Enemy'): boolean => {
    return grid.canPlaceCharacterOnTile(hexId, team)
  }

  const getCharacterTeam = (hexId: number): 'Self' | 'Enemy' | undefined => {
    return grid.getCharacterTeam(hexId)
  }

  const moveCharacter = (fromHexId: number, toHexId: number, characterId: string): boolean => {
    // Don't move if dropping on the same hex
    if (fromHexId === toHexId) {
      return false
    }

    // Get the team from the source hex
    const team = grid.getCharacterTeam(fromHexId) || 'Self'

    // Move character from source to target hex
    grid.removeCharacter(fromHexId)
    const success = grid.placeCharacter(toHexId, characterId, team)
    characterUpdateTrigger.value++ // Trigger reactivity
    return success
  }

  // Grid utility functions
  const getArrowPath = (startHexId: number, endHexId: number): string => {
    const startHex = grid.getHexById(startHexId)
    const endHex = grid.getHexById(endHexId)
    return layout.getArrowPath(startHex, endHex)
  }

  const getHexById = (id: number): Hex => {
    return grid.getHexById(id)
  }

  const getHexPosition = (hexId: number) => {
    try {
      const hex = getHexById(hexId)
      return layout.hexToPixel(hex)
    } catch {
      return { x: 0, y: 0 }
    }
  }

  // GridTile-specific methods
  const getTile = (hexOrId: Hex | number): GridTile => {
    return grid.getTile(hexOrId)
  }

  const getAllTiles = (): GridTile[] => {
    return grid.getAllTiles()
  }

  const getTilesWithCharacters = (): GridTile[] => {
    characterUpdateTrigger.value // Reactivity trigger
    return grid.getTilesWithCharacters()
  }

  return {
    // Core grid data (readonly)
    grid: readonly(grid),
    layout: readonly(layout),
    hexes: hexes as Hex[],
    gridOrigin: readonly(gridOrigin),

    // Reactive state
    characterPlacements,

    // Getters
    totalHexes,
    charactersPlaced,
    placedCharactersList,
    availableSelf,
    availableEnemy,

    // Actions
    placeCharacterOnHex,
    removeCharacterFromHex,
    clearAllCharacters,
    getCharacterOnHex,
    isHexOccupied,
    canPlaceCharacter,
    canPlaceCharacterOnTile,
    getCharacterTeam,
    moveCharacter,
    getArrowPath,
    getHexById,
    getHexPosition,

    // GridTile methods
    getTile,
    getAllTiles,
    getTilesWithCharacters,
  }
})
