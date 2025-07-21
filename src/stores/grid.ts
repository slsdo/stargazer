import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { Grid, type GridTile } from '../lib/grid'
import { Layout, POINTY } from '../lib/layout'
import { State, FULL_GRID } from '../lib/constants'
import { getMapByKey, type MapConfig } from '../lib/maps'
import type { Hex } from '../lib/hex'

export const useGridStore = defineStore('grid', () => {
  // Core grid instances
  const grid = ref(new Grid())
  const gridOrigin = { x: 300, y: 300 }
  const layout = new Layout(POINTY, { x: 40, y: 40 }, gridOrigin)
  const currentMap = ref('arena1')

  // Computed hexes that updates when grid changes
  const hexes = computed(() => grid.value.keys())

  // Reactive trigger for character updates
  const characterUpdateTrigger = ref(0)

  // Getters that read from Grid instance
  const totalHexes = computed(() => hexes.value.length)
  const charactersPlaced = computed(() => {
    characterUpdateTrigger.value // Reactivity trigger
    return grid.value.getCharacterCount()
  })
  const placedCharactersList = computed(() => {
    characterUpdateTrigger.value // Reactivity trigger
    return Array.from(grid.value.getCharacterPlacements().entries())
  })
  const characterPlacements = computed(() => {
    characterUpdateTrigger.value // Reactivity trigger
    return grid.value.getCharacterPlacements()
  })

  // Team availability getters
  const availableAlly = computed(() => {
    characterUpdateTrigger.value // Reactivity trigger
    return grid.value.getAvailableAlly()
  })

  const availableEnemy = computed(() => {
    characterUpdateTrigger.value // Reactivity trigger
    return grid.value.getAvailableEnemy()
  })

  // Compute closest enemy map using Grid method
  const closestEnemyMap = computed(() => {
    characterUpdateTrigger.value // Reactivity trigger
    return grid.value.getClosestEnemyMap()
  })

  // Compute closest ally map using Grid method
  const closestAllyMap = computed(() => {
    characterUpdateTrigger.value // Reactivity trigger
    return grid.value.getClosestAllyMap()
  })

  // Actions that use Grid instance
  const placeCharacterOnHex = (
    hexId: number,
    characterId: string,
    team: 'Ally' | 'Enemy' = 'Ally',
  ): boolean => {
    console.log('Store: placing character on hex', hexId, characterId, 'team:', team)
    const success = grid.value.placeCharacter(hexId, characterId, team)
    if (success) {
      characterUpdateTrigger.value++ // Trigger reactivity
      console.log('Store: character placements now:', grid.value.getCharacterPlacements())
    } else {
      console.log('Store: placement failed - team restrictions or duplicate character')
    }
    return success
  }

  const removeCharacterFromHex = (hexId: number) => {
    grid.value.removeCharacter(hexId)
    characterUpdateTrigger.value++ // Trigger reactivity
  }

  const clearAllCharacters = () => {
    grid.value.clearAllCharacters()
    characterUpdateTrigger.value++ // Trigger reactivity
  }

  const getCharacterOnHex = (hexId: number): string | undefined => {
    return grid.value.getCharacter(hexId)
  }

  const isHexOccupied = (hexId: number): boolean => {
    return grid.value.hasCharacter(hexId)
  }

  const canPlaceCharacter = (characterId: string, team: 'Ally' | 'Enemy'): boolean => {
    return grid.value.canPlaceCharacter(characterId, team)
  }

  const canPlaceCharacterOnTile = (hexId: number, team: 'Ally' | 'Enemy'): boolean => {
    return grid.value.canPlaceCharacterOnTile(hexId, team)
  }

  const getCharacterTeam = (hexId: number): 'Ally' | 'Enemy' | undefined => {
    return grid.value.getCharacterTeam(hexId)
  }

  const moveCharacter = (fromHexId: number, toHexId: number, characterId: string): boolean => {
    // Don't move if dropping on the same hex
    if (fromHexId === toHexId) {
      return false
    }

    // Get the team from the source hex
    const team = grid.value.getCharacterTeam(fromHexId) || 'Ally'

    // Move character from source to target hex
    grid.value.removeCharacter(fromHexId)
    const success = grid.value.placeCharacter(toHexId, characterId, team)
    characterUpdateTrigger.value++ // Trigger reactivity
    return success
  }

  // Grid utility functions
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

  const getAllTiles = (): GridTile[] => {
    return grid.value.getAllTiles()
  }

  const getTilesWithCharacters = (): GridTile[] => {
    characterUpdateTrigger.value // Reactivity trigger
    return grid.value.getTilesWithCharacters()
  }

  const autoPlaceCharacter = (characterId: string, team: 'Ally' | 'Enemy'): boolean => {
    // Check if character can be placed
    if (!canPlaceCharacter(characterId, team)) {
      console.log('Store: cannot place character - team restrictions or duplicate')
      return false
    }

    // Get all tiles that can accept this team
    const availableTiles = getAllTiles().filter(
      (tile) => canPlaceCharacterOnTile(tile.hex.getId(), team) && !tile.character,
    )

    if (availableTiles.length === 0) {
      console.log('Store: no available tiles for team', team)
      return false
    }

    // Sort by hex ID descending (largest first) and pick randomly from available tiles
    availableTiles.sort((a, b) => b.hex.getId() - a.hex.getId())

    // Find a random tile to place the character
    const randomIndex = Math.floor(Math.random() * availableTiles.length)
    const selectedTile = availableTiles[randomIndex]

    console.log(
      'Store: auto-placing character',
      characterId,
      'on hex',
      selectedTile.hex.getId(),
      'team:',
      team,
    )
    return placeCharacterOnHex(selectedTile.hex.getId(), characterId, team)
  }

  const handleHexClick = (hex: Hex): boolean => {
    const hexId = hex.getId()
    console.log('Store: hex clicked:', hexId)

    // Get the tile to check its state
    const tile = getTile(hex)

    // Check if the hex is occupied by a character
    if (tile.state === State.OCCUPIED_ALLY || tile.state === State.OCCUPIED_ENEMY) {
      console.log('Store: hex', hexId, 'is occupied - removing character')
      removeCharacterFromHex(hexId)
      return true // Character was removed
    } else {
      console.log('Store: hex', hexId, 'is not occupied, state:', tile.state)
      return false // No action taken
    }
  }

  const switchMap = (mapKey: string): boolean => {
    const mapConfig = getMapByKey(mapKey)
    if (!mapConfig) {
      console.log('Store: map not found:', mapKey)
      return false
    }

    console.log('Store: switching to map:', mapConfig.name)

    // Create new grid with the selected map
    grid.value = new Grid(FULL_GRID, mapConfig)
    currentMap.value = mapKey

    // Trigger reactivity
    characterUpdateTrigger.value++

    return true
  }

  return {
    // Core grid data (readonly)
    grid: readonly(grid),
    layout: readonly(layout),
    hexes,
    gridOrigin: readonly(gridOrigin),
    currentMap: readonly(currentMap),

    // Reactive state
    characterPlacements,

    // Getters
    totalHexes,
    charactersPlaced,
    placedCharactersList,
    availableAlly,
    availableEnemy,
    closestEnemyMap,
    closestAllyMap,

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
    autoPlaceCharacter,
    handleHexClick,
    switchMap,
  }
})
