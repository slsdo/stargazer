import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { Grid } from '../lib/Grid'
import { Layout, POINTY } from '../lib/Layout'

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
  const placeCharacterOnHex = (hexId: number, imageSrc: string) => {
    console.log('Store: placing character on hex', hexId, imageSrc)
    grid.placeCharacterById(hexId, imageSrc)
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

  // Grid utility functions
  const getArrowPath = (startHexId: number, endHexId: number): string => {
    return grid.getArrowPath(startHexId, endHexId, layout)
  }

  const getHexById = (id: number) => {
    return grid.getHexById(id)
  }

  const getHexPosition = (hexId: number) => {
    const hex = getHexById(hexId)
    return hex ? layout.hexToPixel(hex) : { x: 0, y: 0 }
  }

  return {
    // Core grid data (readonly)
    grid: readonly(grid),
    layout: readonly(layout),
    hexes: readonly(hexes),
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
    getArrowPath,
    getHexById,
    getHexPosition,
  }
})