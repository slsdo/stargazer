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

  // Actions that use Grid instance
  const placeCharacterOnHex = (hexId: number, characterId: string) => {
    console.log('Store: placing character on hex', hexId, characterId)
    grid.placeCharacterById(hexId, characterId)
    characterUpdateTrigger.value++ // Trigger reactivity
    console.log('Store: character placements now:', grid.getCharacterPlacements())
  }

  const removeCharacterFromHex = (hexId: number) => {
    grid.removeCharacterById(hexId)
    characterUpdateTrigger.value++ // Trigger reactivity
  }

  const clearAllCharacters = () => {
    grid.clearAllCharacters()
    characterUpdateTrigger.value++ // Trigger reactivity
  }

  const getCharacterOnHex = (hexId: number): string | undefined => {
    return grid.getCharacterById(hexId)
  }

  const isHexOccupied = (hexId: number): boolean => {
    return grid.hasCharacterById(hexId)
  }

  const moveCharacter = (fromHexId: number, toHexId: number, characterId: string): boolean => {
    // Don't move if dropping on the same hex
    if (fromHexId === toHexId) {
      return false
    }

    // Move character from source to target hex
    grid.removeCharacterById(fromHexId)
    grid.placeCharacterById(toHexId, characterId)
    characterUpdateTrigger.value++ // Trigger reactivity
    return true
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
  const getTile = (hex: Hex): GridTile => {
    return grid.getTile(hex)
  }

  const getTileById = (hexId: number): GridTile => {
    return grid.getTileById(hexId)
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

    // Actions
    placeCharacterOnHex,
    removeCharacterFromHex,
    clearAllCharacters,
    getCharacterOnHex,
    isHexOccupied,
    moveCharacter,
    getArrowPath,
    getHexById,
    getHexPosition,

    // GridTile methods
    getTile,
    getTileById,
    getAllTiles,
    getTilesWithCharacters,
  }
})
