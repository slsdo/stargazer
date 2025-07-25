import { defineStore } from 'pinia'
import { ref, computed, readonly, reactive } from 'vue'
import { Grid, type GridTile } from '../lib/grid'
import { Layout, POINTY } from '../lib/layout'
import { State } from '../lib/types/state'
import { FULL_GRID } from '../lib/constants'
import { getMapByKey, type MapConfig } from '../lib/maps'
import type { Hex } from '../lib/hex'

export const useGridStore = defineStore('grid', () => {
  // Core grid instance - using reactive for automatic reactivity
  const grid = reactive(new Grid())
  const gridOrigin = { x: 300, y: 300 }
  const layout = new Layout(POINTY, { x: 40, y: 40 }, gridOrigin)
  const currentMap = ref('arena1')

  // Computed hexes that updates when grid changes
  const hexes = computed(() => {
    return grid.keys()
  })

  // Core grid operations
  const setState = (hex: Hex, state: State): void => {
    grid.setState(hex, state)
  }

  const getState = (hex: Hex): State => {
    return grid.getState(hex)
  }

  // Grid utility functions
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

  const getAllTiles = computed(() => {
    return grid.getAllTiles()
  })

  const switchMap = (mapKey: string): boolean => {
    const mapConfig = getMapByKey(mapKey)
    if (!mapConfig) {
      return false
    }

    // Create new grid with the selected map
    const newGrid = new Grid(FULL_GRID, mapConfig)
    // Copy properties to maintain reactivity
    Object.assign(grid, newGrid)
    currentMap.value = mapKey

    return true
  }

  const getCurrentMapConfig = (): MapConfig | null => {
    return getMapByKey(currentMap.value) ?? null
  }

  // Arrow path utility
  const getArrowPath = (
    startHexId: number,
    endHexId: number,
    characterRadius: number = 30,
    invertCurve: boolean = false,
  ): string => {
    const startHex = grid.getHexById(startHexId)
    const endHex = grid.getHexById(endHexId)
    return layout.getArrowPath(startHex, endHex, characterRadius, invertCurve)
  }

  return {
    // Core grid data (readonly)
    grid: readonly(grid),
    layout: readonly(layout),
    hexes,
    gridOrigin: readonly(gridOrigin),
    currentMap: readonly(currentMap),

    // Core grid operations
    setState,
    getState,
    getHexById,
    getHexPosition,
    getTile,
    getAllTiles,
    switchMap,
    getCurrentMapConfig,
    getArrowPath,

    // Internal use by other stores
    _getGrid: () => grid, // Direct access for character store
  }
})
