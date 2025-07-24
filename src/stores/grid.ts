import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { Grid, type GridTile } from '../lib/grid'
import { Layout, POINTY } from '../lib/layout'
import { State } from '../lib/types/state'
import { FULL_GRID } from '../lib/constants'
import { getMapByKey, type MapConfig } from '../lib/maps'
import type { Hex } from '../lib/hex'
import { Team } from '../lib/types/team'
import { loadAllData } from '../utils/dataLoader'
import { getGridStateFromCurrentUrl } from '../utils/urlStateManager'
import type { CharacterType } from '../lib/types/character'
import type { ArtifactType } from '../lib/types/artifact'

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

  // Artifact tracking
  const allyArtifact = ref<string | null>(null)
  const enemyArtifact = ref<string | null>(null)

  // Data state
  const characters = ref<CharacterType[]>([])
  const artifacts = ref<ArtifactType[]>([])
  const characterImages = ref<Record<string, string>>({})
  const artifactImages = ref<Record<string, string>>({})
  const icons = ref<Record<string, string>>({})
  const dataLoaded = ref(false)

  // Character ranges - now managed internally
  let characterRanges = new Map<string, number>()

  // Initialize all data using dataLoader
  const initializeData = () => {
    if (dataLoaded.value) {
      return // Already loaded
    }

    try {
      const data = loadAllData()

      // Update reactive state
      characters.value = data.characters
      artifacts.value = data.artifacts
      characterImages.value = data.characterImages
      artifactImages.value = data.artifactImages
      icons.value = data.icons
      characterRanges = data.characterRanges

      dataLoaded.value = true
      characterUpdateTrigger.value++ // Trigger reactivity

      // After data is loaded, try to restore state from URL
      restoreStateFromUrl()
    } catch (error) {
      console.error('Failed to initialize data:', error)
    }
  }

  // Restore grid state from URL parameters
  const restoreStateFromUrl = () => {
    try {
      const urlState = getGridStateFromCurrentUrl()
      if (!urlState) {
        return // No state in URL
      }

      console.log('Restoring grid state from URL:', urlState)

      // Switch to the specified map
      if (urlState.map !== currentMap.value) {
        const success = switchMap(urlState.map)
        if (!success) {
          console.warn(`Failed to switch to map: ${urlState.map}`)
          return
        }
      }

      // Clear existing placements
      clearAllCharacters()
      clearAllArtifacts()

      // Restore character placements
      urlState.characters.forEach(({ hexId, characterId, team }) => {
        const success = placeCharacterOnHex(hexId, characterId, team)
        if (!success) {
          console.warn(`Failed to place character ${characterId} on hex ${hexId}`)
        }
      })

      // Restore artifacts
      if (urlState.artifacts.ally) {
        placeArtifact(urlState.artifacts.ally, Team.ALLY)
      }
      if (urlState.artifacts.enemy) {
        placeArtifact(urlState.artifacts.enemy, Team.ENEMY)
      }

      console.log('Successfully restored grid state from URL')
    } catch (error) {
      console.error('Failed to restore state from URL:', error)
    }
  }

  // Consolidated character state - single computation point
  const characterState = computed(() => {
    characterUpdateTrigger.value // Single reactivity trigger
    return {
      count: grid.value.getCharacterCount(),
      placements: grid.value.getCharacterPlacements(),
      placedList: Array.from(grid.value.getCharacterPlacements().entries()),
      tilesWithCharacters: grid.value.getTilesWithCharacters(),
      availableAlly: grid.value.getAvailableAlly(),
      availableEnemy: grid.value.getAvailableEnemy(),
      closestEnemyMap: grid.value.getClosestEnemyMap(characterRanges),
      closestAllyMap: grid.value.getClosestAllyMap(characterRanges),
    }
  })

  // Individual getters that access consolidated state
  const totalHexes = computed(() => hexes.value.length)
  const charactersPlaced = computed(() => characterState.value.count)
  const placedCharactersList = computed(() => characterState.value.placedList)
  const characterPlacements = computed(() => characterState.value.placements)
  const availableAlly = computed(() => characterState.value.availableAlly)
  const availableEnemy = computed(() => characterState.value.availableEnemy)
  const closestEnemyMap = computed(() => characterState.value.closestEnemyMap)
  const closestAllyMap = computed(() => characterState.value.closestAllyMap)

  // Actions that use Grid instance
  const placeCharacterOnHex = (
    hexId: number,
    characterId: string,
    team: Team = Team.ALLY,
  ): boolean => {
    const success = grid.value.placeCharacter(hexId, characterId, team)
    if (success) {
      characterUpdateTrigger.value++ // Trigger reactivity
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

  const canPlaceCharacter = (characterId: string, team: Team): boolean => {
    return grid.value.canPlaceCharacter(characterId, team)
  }

  const canPlaceCharacterOnTile = (hexId: number, team: Team): boolean => {
    return grid.value.canPlaceCharacterOnTile(hexId, team)
  }

  const getCharacterTeam = (hexId: number): Team | undefined => {
    return grid.value.getCharacterTeam(hexId)
  }

  /* Moves a character with automatic team switching based on target tile state.
   * Characters can be moved to any valid tile and will automatically join the
   * appropriate team (ally/enemy). Restores original position on failure. */

  /* Swaps positions of two characters, handling cross-team moves if necessary. */
  const swapCharacters = (fromHexId: number, toHexId: number): boolean => {
    // Don't swap if same hex
    if (fromHexId === toHexId) {
      return false
    }

    // Get both characters and their teams
    const fromCharacterId = grid.value.getCharacter(fromHexId)
    const toCharacterId = grid.value.getCharacter(toHexId)
    const fromTeam = grid.value.getCharacterTeam(fromHexId)
    const toTeam = grid.value.getCharacterTeam(toHexId)

    // Validate both hexes have characters
    if (!fromCharacterId || !toCharacterId || fromTeam === undefined || toTeam === undefined) {
      return false
    }

    // Get tile states to determine target teams
    const fromTileState = grid.value.getTile(fromHexId).state
    const toTileState = grid.value.getTile(toHexId).state

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

    // Remove both characters first
    grid.value.removeCharacter(fromHexId)
    grid.value.removeCharacter(toHexId)

    // Place characters in swapped positions with appropriate teams
    const success1 = grid.value.placeCharacter(fromHexId, toCharacterId, fromTargetTeam)
    const success2 = grid.value.placeCharacter(toHexId, fromCharacterId, toTargetTeam)

    // If either placement fails, restore original positions
    if (!success1 || !success2) {
      // Clean up any partial placements
      if (success1) grid.value.removeCharacter(fromHexId)
      if (success2) grid.value.removeCharacter(toHexId)

      // Restore original positions
      grid.value.placeCharacter(fromHexId, fromCharacterId, fromTeam)
      grid.value.placeCharacter(toHexId, toCharacterId, toTeam)
      return false
    }

    characterUpdateTrigger.value++ // Trigger Vue reactivity for UI updates
    return true
  }

  const moveCharacter = (fromHexId: number, toHexId: number, characterId: string): boolean => {
    // Don't move if dropping on the same hex
    if (fromHexId === toHexId) {
      return false
    }

    // Get the team from the source hex - needed for restoration if move fails
    const fromTile = grid.value.getTile(fromHexId)
    const team = fromTile.team ?? Team.ALLY

    // Get target tile to determine what team the character should join
    const targetTile = grid.value.getTile(toHexId)
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
    // Instead of removing then placing, let's try a direct approach
    if (team !== targetTeam) {
      // Cross-team move - remove from original team first
      grid.value.removeCharacter(fromHexId)

      // For cross-team moves, we should always be able to place the character
      // since we're switching teams (capacity shouldn't be an issue)
      const success = grid.value.placeCharacter(toHexId, characterId, targetTeam)

      if (!success) {
        // This should rarely happen for cross-team moves, but restore if it does
        grid.value.placeCharacter(fromHexId, characterId, team)
      }

      characterUpdateTrigger.value++ // Trigger Vue reactivity for UI updates
      return success
    } else {
      // Same team move - use the original logic
      grid.value.removeCharacter(fromHexId)
      const success = grid.value.placeCharacter(toHexId, characterId, targetTeam)

      if (!success) {
        grid.value.placeCharacter(fromHexId, characterId, team)
      }

      characterUpdateTrigger.value++ // Trigger Vue reactivity for UI updates
      return success
    }
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

  // Static utility methods
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
    // Use consolidated state instead of direct grid access
    return characterState.value.tilesWithCharacters
  }

  const autoPlaceCharacter = (characterId: string, team: Team): boolean => {
    // Check if character can be placed
    if (!canPlaceCharacter(characterId, team)) {
      return false
    }

    // Get all tiles that can accept this team
    const availableTiles = getAllTiles().filter(
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

  const handleHexClick = (hex: Hex): boolean => {
    const hexId = hex.getId()

    // Get the tile to check its state
    const tile = getTile(hex)

    // Check if the hex is occupied by a character
    if (tile.state === State.OCCUPIED_ALLY || tile.state === State.OCCUPIED_ENEMY) {
      removeCharacterFromHex(hexId)
      return true // Character was removed
    } else {
      return false // No action taken
    }
  }

  const switchMap = (mapKey: string): boolean => {
    const mapConfig = getMapByKey(mapKey)
    if (!mapConfig) {
      return false
    }

    // Create new grid with the selected map
    grid.value = new Grid(FULL_GRID, mapConfig)
    currentMap.value = mapKey

    // Trigger reactivity
    characterUpdateTrigger.value++

    return true
  }

  // Artifact management functions
  const placeArtifact = (artifactId: string, team: Team): boolean => {
    if (team === Team.ALLY) {
      allyArtifact.value = artifactId
    } else {
      enemyArtifact.value = artifactId
    }

    return true
  }

  const removeArtifact = (team: Team) => {
    if (team === Team.ALLY) {
      allyArtifact.value = null
    } else {
      enemyArtifact.value = null
    }
  }

  const clearAllArtifacts = () => {
    allyArtifact.value = null
    enemyArtifact.value = null
  }

  return {
    // Core grid data (readonly)
    grid: readonly(grid),
    layout: readonly(layout),
    hexes,
    gridOrigin: readonly(gridOrigin),
    currentMap: readonly(currentMap),

    // Data state (readonly)
    characters: readonly(characters),
    artifacts: readonly(artifacts),
    characterImages: readonly(characterImages),
    artifactImages: readonly(artifactImages),
    icons: readonly(icons),
    dataLoaded: readonly(dataLoaded),

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
    swapCharacters,
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

    // Data management
    initializeData,

    // Artifact management
    allyArtifact: readonly(allyArtifact),
    enemyArtifact: readonly(enemyArtifact),
    placeArtifact,
    removeArtifact,
    clearAllArtifacts,
  }
})
