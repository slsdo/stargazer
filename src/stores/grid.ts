import { defineStore } from 'pinia'
import { ref, computed, readonly, shallowRef, triggerRef } from 'vue'
import { Grid, type GridTile } from '../lib/grid'
import { Layout, POINTY } from '../lib/layout'
import { State } from '../lib/types/state'
import { FULL_GRID } from '../lib/constants'
import { getMapByKey, type MapConfig } from '../lib/maps'
import type { Hex } from '../lib/hex'

export const useGridStore = defineStore('grid', () => {
  // Core grid instance - using shallowRef for performance
  // We'll manually trigger reactivity when needed
  const grid = shallowRef(new Grid())
  const gridOrigin = { x: 300, y: 300 }
  const layout = new Layout(POINTY, { x: 40, y: 40 }, gridOrigin)
  const currentMap = ref('arena1')

  // Version counter to trigger reactivity - replaces characterUpdateTrigger
  const gridVersion = ref(0)
  
  // Internal helper to trigger grid reactivity
  const triggerGridUpdate = () => {
    gridVersion.value++
    triggerRef(grid)
  }

  // Computed hexes that updates when grid changes
  const hexes = computed(() => {
    gridVersion.value // dependency
    return grid.value.keys()
  })

  // Core grid operations that properly trigger reactivity
  const setState = (hex: Hex, state: State): void => {
    grid.value.setState(hex, state)
    triggerGridUpdate()
  }

  const getState = (hex: Hex): State => {
    return grid.value.getState(hex)
  }

  // Grid utility functions
  const getHexById = (id: number): Hex => {
    return grid.value.getHexById(id)
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
    return grid.value.getTile(hexOrId)
  }

  const getAllTiles = computed(() => {
    gridVersion.value // dependency
    return grid.value.getAllTiles()
  })

  const switchMap = (mapKey: string): boolean => {
    const mapConfig = getMapByKey(mapKey)
    if (!mapConfig) {
      return false
    }

    // Create new grid with the selected map
    grid.value = new Grid(FULL_GRID, mapConfig)
    currentMap.value = mapKey
    
    // Trigger reactivity
    triggerGridUpdate()
    
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
    const startHex = grid.value.getHexById(startHexId)
    const endHex = grid.value.getHexById(endHexId)
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
    _triggerGridUpdate: triggerGridUpdate,
    _getGrid: () => grid.value, // Direct access for character store
  }
})