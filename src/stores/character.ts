import { defineStore } from 'pinia'
import { computed } from 'vue'
import { Team } from '../lib/types/team'
import { State } from '../lib/types/state'
import { useGridStore } from './grid'
import { useGameDataStore } from './gameData'
import type { GridTile } from '../lib/grid'

export const useCharacterStore = defineStore('character', () => {
  const gridStore = useGridStore()
  const gameDataStore = useGameDataStore()

  // Consolidated character state - single computation point
  const characterState = computed(() => {
    const grid = gridStore._getGrid()
    return {
      count: grid.getCharacterCount(),
      placements: grid.getCharacterPlacements(),
      placedList: Array.from(grid.getCharacterPlacements().entries()),
      tilesWithCharacters: grid.getTilesWithCharacters(),
      availableAlly: grid.getAvailableAlly(),
      availableEnemy: grid.getAvailableEnemy(),
    }
  })

  // Individual getters that access consolidated state
  const charactersPlaced = computed(() => characterState.value.count)
  const placedCharactersList = computed(() => characterState.value.placedList)
  const characterPlacements = computed(() => characterState.value.placements)
  const availableAlly = computed(() => characterState.value.availableAlly)
  const availableEnemy = computed(() => characterState.value.availableEnemy)

  const getTilesWithCharacters = (): GridTile[] => {
    return characterState.value.tilesWithCharacters
  }

  // Character management actions
  const placeCharacterOnHex = (
    hexId: number,
    characterId: string,
    team: Team = Team.ALLY,
  ): boolean => {
    const grid = gridStore._getGrid()
    const success = grid.placeCharacter(hexId, characterId, team)
    return success
  }

  const removeCharacterFromHex = (hexId: number) => {
    const grid = gridStore._getGrid()
    grid.removeCharacter(hexId)
  }

  const clearAllCharacters = () => {
    const grid = gridStore._getGrid()
    grid.clearAllCharacters()
  }

  const getCharacterOnHex = (hexId: number): string | undefined => {
    const grid = gridStore._getGrid()
    return grid.getCharacter(hexId)
  }

  const isHexOccupied = (hexId: number): boolean => {
    const grid = gridStore._getGrid()
    return grid.hasCharacter(hexId)
  }

  const canPlaceCharacter = (characterId: string, team: Team): boolean => {
    const grid = gridStore._getGrid()
    return grid.canPlaceCharacter(characterId, team)
  }

  const canPlaceCharacterOnTile = (hexId: number, team: Team): boolean => {
    const grid = gridStore._getGrid()
    return grid.canPlaceCharacterOnTile(hexId, team)
  }

  const getCharacterTeam = (hexId: number): Team | undefined => {
    const grid = gridStore._getGrid()
    return grid.getCharacterTeam(hexId)
  }

  const swapCharacters = (fromHexId: number, toHexId: number): boolean => {
    // Don't swap if same hex
    if (fromHexId === toHexId) {
      return false
    }

    const grid = gridStore._getGrid()

    // Get both characters and their teams
    const fromCharacterId = grid.getCharacter(fromHexId)
    const toCharacterId = grid.getCharacter(toHexId)
    const fromTeam = grid.getCharacterTeam(fromHexId)
    const toTeam = grid.getCharacterTeam(toHexId)

    // Validate both hexes have characters
    if (!fromCharacterId || !toCharacterId || fromTeam === undefined || toTeam === undefined) {
      return false
    }

    // Get tile states to determine target teams
    const fromTileState = grid.getTile(fromHexId).state
    const toTileState = grid.getTile(toHexId).state

    // Determine what teams the characters should have after swap
    let fromTargetTeam: Team | null = null
    let toTargetTeam: Team | null = null

    if (fromTileState === State.AVAILABLE_ALLY || fromTileState === State.OCCUPIED_ALLY) {
      fromTargetTeam = Team.ALLY
    } else if (fromTileState === State.AVAILABLE_ENEMY || fromTileState === State.OCCUPIED_ENEMY) {
      fromTargetTeam = Team.ENEMY
    }

    if (toTileState === State.AVAILABLE_ALLY || toTileState === State.OCCUPIED_ALLY) {
      toTargetTeam = Team.ALLY
    } else if (toTileState === State.AVAILABLE_ENEMY || toTileState === State.OCCUPIED_ENEMY) {
      toTargetTeam = Team.ENEMY
    }

    if (fromTargetTeam === null || toTargetTeam === null) {
      return false
    }

    // Skip cache invalidation during intermediate operations
    // Remove both characters first
    grid.removeCharacter(fromHexId, true) // Skip cache invalidation
    grid.removeCharacter(toHexId, true) // Skip cache invalidation

    // Place characters in swapped positions with appropriate teams
    const success1 = grid.placeCharacter(fromHexId, toCharacterId, fromTargetTeam, true) // Skip cache invalidation
    const success2 = grid.placeCharacter(toHexId, fromCharacterId, toTargetTeam, true) // Skip cache invalidation

    // If either placement fails, restore original positions
    if (!success1 || !success2) {
      // Clean up any partial placements
      if (success1) grid.removeCharacter(fromHexId, true) // Skip cache invalidation
      if (success2) grid.removeCharacter(toHexId, true) // Skip cache invalidation

      // Restore original positions
      grid.placeCharacter(fromHexId, fromCharacterId, fromTeam, true) // Skip cache invalidation
      grid.placeCharacter(toHexId, toCharacterId, toTeam, true) // Skip cache invalidation
      
      // Single cache invalidation before returning false
      grid.invalidateCaches()
      return false
    }

    // Final cache invalidation after all operations complete
    grid.invalidateCaches()
    return true
  }

  const moveCharacter = (fromHexId: number, toHexId: number, characterId: string): boolean => {
    // Don't move if dropping on the same hex
    if (fromHexId === toHexId) {
      return false
    }

    const grid = gridStore._getGrid()

    // Get the team from the source hex - needed for restoration if move fails
    const fromTile = grid.getTile(fromHexId)
    const team = fromTile.team ?? Team.ALLY

    // Get target tile to determine what team the character should join
    const targetTile = grid.getTile(toHexId)
    const targetState = targetTile.state

    // Determine target team based on tile state (enables automatic team switching)
    let targetTeam: Team | null = null
    if (targetState === State.AVAILABLE_ALLY || targetState === State.OCCUPIED_ALLY) {
      targetTeam = Team.ALLY
    } else if (targetState === State.AVAILABLE_ENEMY || targetState === State.OCCUPIED_ENEMY) {
      targetTeam = Team.ENEMY
    }

    // If target tile doesn't support character placement, fail the move
    if (targetTeam === null) {
      return false
    }

    // For cross-team moves, we need to handle the character transfer more carefully
    if (team !== targetTeam) {
      // Cross-team move - remove from original team first
      grid.removeCharacter(fromHexId, true) // Skip cache invalidation

      // For cross-team moves, we should always be able to place the character
      const success = grid.placeCharacter(toHexId, characterId, targetTeam) // Final operation - invalidate caches

      if (!success) {
        // This should rarely happen for cross-team moves, but restore if it does
        grid.placeCharacter(fromHexId, characterId, team)
      }

      return success
    } else {
      // Same team move - use the original logic
      grid.removeCharacter(fromHexId, true) // Skip cache invalidation
      const success = grid.placeCharacter(toHexId, characterId, targetTeam) // Final operation - invalidate caches

      if (!success) {
        grid.placeCharacter(fromHexId, characterId, team)
      }

      return success
    }
  }

  const autoPlaceCharacter = (characterId: string, team: Team): boolean => {
    // Check if character can be placed
    if (!canPlaceCharacter(characterId, team)) {
      return false
    }

    // Get all tiles that can accept this team
    const availableTiles = gridStore.getAllTiles.filter(
      (tile) => canPlaceCharacterOnTile(tile.hex.getId(), team) && !tile.character,
    )

    if (availableTiles.length === 0) {
      return false
    }

    // Sort by hex ID descending (largest first) and pick randomly from available tiles
    availableTiles.sort((a, b) => b.hex.getId() - a.hex.getId())

    // Find a random tile to place the character
    const randomIndex = Math.floor(Math.random() * availableTiles.length)
    const selectedTile = availableTiles[randomIndex]

    return placeCharacterOnHex(selectedTile.hex.getId(), characterId, team)
  }

  const handleHexClick = (hex: import('../lib/hex').Hex): boolean => {
    const hexId = hex.getId()

    // Get the tile to check its state
    const tile = gridStore.getTile(hex)

    // Check if the hex is occupied by a character
    if (tile.state === State.OCCUPIED_ALLY || tile.state === State.OCCUPIED_ENEMY) {
      removeCharacterFromHex(hexId)
      return true // Character was removed
    } else {
      return false // No action taken
    }
  }

  return {
    // Reactive state
    characterPlacements,
    charactersPlaced,
    placedCharactersList,
    availableAlly,
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
    swapCharacters,
    getTilesWithCharacters,
    autoPlaceCharacter,
    handleHexClick,
  }
})
