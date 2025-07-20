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

  // Reactive state
  const characterPlacements = ref(new Map<number, string>())

  // Getters
  const totalHexes = computed(() => hexes.length)
  const charactersPlaced = computed(() => characterPlacements.value.size)
  const placedCharactersList = computed(() => 
    Array.from(characterPlacements.value.entries())
  )

  // Actions
  const placeCharacterOnHex = (hexId: number, imageSrc: string) => {
    console.log('Store: placing character on hex', hexId, imageSrc)
    characterPlacements.value.set(hexId, imageSrc)
    console.log('Store: character placements now:', characterPlacements.value)
  }

  const removeCharacterFromHex = (hexId: number) => {
    characterPlacements.value.delete(hexId)
  }

  const clearAllCharacters = () => {
    characterPlacements.value.clear()
  }

  const getCharacterOnHex = (hexId: number): string | undefined => {
    return characterPlacements.value.get(hexId)
  }

  const isHexOccupied = (hexId: number): boolean => {
    return characterPlacements.value.has(hexId)
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
    characterPlacements: readonly(characterPlacements),
    
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