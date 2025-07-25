import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import { Grid, type GridTile } from '../lib/grid'
import { Pathfinding } from '../lib/pathfinding'
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

      // Clear existing state first
      clearAllCharacters()
      clearAllArtifacts()

      // Restore all tile states from the URL
      urlState.tiles.forEach(({ hexId, state }) => {
        try {
          const hex = grid.value.getHexById(hexId)
          grid.value.setState(hex, state)
        } catch (error) {
          console.warn(`Failed to restore tile state for hex ${hexId}:`, error)
        }
      })

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
    }
  })

  // Individual getters that access consolidated state
  const totalHexes = computed(() => hexes.value.length)
  const charactersPlaced = computed(() => characterState.value.count)
  const placedCharactersList = computed(() => characterState.value.placedList)
  const characterPlacements = computed(() => characterState.value.placements)
  const availableAlly = computed(() => characterState.value.availableAlly)
  const availableEnemy = computed(() => characterState.value.availableEnemy)

  // Lazy evaluation for expensive computations - only compute when accessed
  // This prevents slowdowns during character placement/movement operations
  const closestEnemyMap = computed(() => {
    characterUpdateTrigger.value // Ensure reactivity
    return grid.value.getClosestEnemyMap(characterRanges)
  })

  const closestAllyMap = computed(() => {
    characterUpdateTrigger.value // Ensure reactivity
    return grid.value.getClosestAllyMap(characterRanges)
  })

  // Debug pathfinding results for visualization
  const debugPathfindingResults = computed(() => {
    characterUpdateTrigger.value // Ensure reactivity
    // Only compute when there are characters on the grid
    if (characterState.value.count === 0) {
      return []
    }

    const results: Array<{ fromHexId: number; toHexId: number; path: Hex[]; team: Team }> = []
    const tilesWithCharacters = characterState.value.tilesWithCharacters
    const allyTiles = tilesWithCharacters.filter((tile) => tile.team === Team.ALLY)
    const enemyTiles = tilesWithCharacters.filter((tile) => tile.team === Team.ENEMY)

    // Safe getTile helper - returns undefined for out-of-bounds hexes during pathfinding
    const getTileHelper = (hex: Hex) => {
      try {
        return grid.value.getTile(hex)
      } catch {
        return undefined
      }
    }

    // Helper function to find closest target (similar to Grid's findClosestTarget but for debug use)
    const findClosestTarget = (
      sourceTile: GridTile,
      targetTiles: GridTile[],
      sourceRange: number,
      canTraverse: (tile: GridTile) => boolean,
    ): { hexId: number; distance: number } | null => {
      let closest: { hexId: number; distance: number } | null = null

      for (const targetTile of targetTiles) {
        const canTraverseToTarget = (tile: GridTile) => {
          if (tile.hex.equals(targetTile.hex)) {
            return true
          }
          return canTraverse(tile)
        }

        // Use range-aware pathfinding
        const effectiveDistance = Pathfinding.calculateEffectiveDistance(
          sourceTile.hex,
          targetTile.hex,
          sourceRange,
          getTileHelper,
          canTraverseToTarget,
          false, // Don't use caching for debug
        )

        if (!effectiveDistance.canReach) {
          continue
        }

        // Use movement distance for comparison (tiles needed to move)
        const distance = effectiveDistance.movementDistance

        if (
          !closest ||
          distance < closest.distance ||
          (distance === closest.distance && targetTile.hex.getId() < closest.hexId)
        ) {
          closest = {
            hexId: targetTile.hex.getId(),
            distance: distance,
          }
        }
      }

      return closest
    }

    // Get paths from allies to closest enemies
    for (const allyTile of allyTiles) {
      const range = allyTile.character ? (characterRanges.get(allyTile.character) ?? 1) : 1
      const closestEnemy = findClosestTarget(
        allyTile,
        enemyTiles,
        range,
        (tile) => tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE,
      )

      if (closestEnemy) {
        const targetTile = enemyTiles.find((t) => t.hex.getId() === closestEnemy.hexId)
        if (targetTile) {
          const path = Pathfinding.findPath(
            allyTile.hex,
            targetTile.hex,
            getTileHelper,
            (tile) => tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE,
          )
          if (path) {
            results.push({
              fromHexId: allyTile.hex.getId(),
              toHexId: closestEnemy.hexId,
              path,
              team: Team.ALLY,
            })
          }
        }
      }
    }

    // Get paths from enemies to closest allies
    for (const enemyTile of enemyTiles) {
      const range = enemyTile.character ? (characterRanges.get(enemyTile.character) ?? 1) : 1
      const closestAlly = findClosestTarget(
        enemyTile,
        allyTiles,
        range,
        (tile) => tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE,
      )

      if (closestAlly) {
        const targetTile = allyTiles.find((t) => t.hex.getId() === closestAlly.hexId)
        if (targetTile) {
          const path = Pathfinding.findPath(
            enemyTile.hex,
            targetTile.hex,
            getTileHelper,
            (tile) => tile.state !== State.BLOCKED && tile.state !== State.BLOCKED_BREAKABLE,
          )
          if (path) {
            results.push({
              fromHexId: enemyTile.hex.getId(),
              toHexId: closestAlly.hexId,
              path,
              team: Team.ENEMY,
            })
          }
        }
      }
    }

    return results
  })

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

    // Skip cache invalidation during intermediate operations
    // Remove both characters first
    grid.value.removeCharacter(fromHexId, true) // Skip cache invalidation
    grid.value.removeCharacter(toHexId, true) // Skip cache invalidation

    // Place characters in swapped positions with appropriate teams
    const success1 = grid.value.placeCharacter(fromHexId, toCharacterId, fromTargetTeam, true) // Skip cache invalidation
    const success2 = grid.value.placeCharacter(toHexId, fromCharacterId, toTargetTeam, true) // Skip cache invalidation

    // If either placement fails, restore original positions
    if (!success1 || !success2) {
      // Clean up any partial placements
      if (success1) grid.value.removeCharacter(fromHexId, true) // Skip cache invalidation
      if (success2) grid.value.removeCharacter(toHexId, true) // Skip cache invalidation

      // Restore original positions
      grid.value.placeCharacter(fromHexId, fromCharacterId, fromTeam, true) // Skip cache invalidation
      grid.value.placeCharacter(toHexId, toCharacterId, toTeam) // Final operation - invalidate caches
      return false
    }

    // Final cache invalidation after all operations complete
    grid.value.invalidateCaches()
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
      grid.value.removeCharacter(fromHexId, true) // Skip cache invalidation

      // For cross-team moves, we should always be able to place the character
      // since we're switching teams (capacity shouldn't be an issue)
      const success = grid.value.placeCharacter(toHexId, characterId, targetTeam) // Final operation - invalidate caches

      if (!success) {
        // This should rarely happen for cross-team moves, but restore if it does
        grid.value.placeCharacter(fromHexId, characterId, team)
      }

      characterUpdateTrigger.value++ // Trigger Vue reactivity for UI updates
      return success
    } else {
      // Same team move - use the original logic
      grid.value.removeCharacter(fromHexId, true) // Skip cache invalidation
      const success = grid.value.placeCharacter(toHexId, characterId, targetTeam) // Final operation - invalidate caches

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

  // Map Editor methods

  /**
   * Sets a hex to the specified state (used by map editor)
   * Removes any existing character and resets the tile completely
   */
  const setHexState = (hexId: number, state: State) => {
    const hex = grid.value.getHexById(hexId)
    if (!hex) return false

    const tile = grid.value.getTile(hexId)

    // Remove character if hex is occupied
    if (tile.state === State.OCCUPIED_ALLY || tile.state === State.OCCUPIED_ENEMY) {
      removeCharacterFromHex(hexId)
    }

    // Set the new state
    grid.value.setState(hex, state)
    characterUpdateTrigger.value++ // Trigger UI reactivity
    return true
  }

  /**
   * Resets all hexes to DEFAULT state (used by "Clear Map" button)
   * Removes all characters and resets all tiles completely
   */
  const clearAllHexStates = () => {
    // Clear all characters first
    clearAllCharacters()

    // Reset all hexes to default state
    for (const hex of hexes.value) {
      grid.value.setState(hex, State.DEFAULT)
    }
    characterUpdateTrigger.value++ // Trigger UI reactivity
  }

  const resetToCurrentMap = () => {
    // Clear all characters first
    clearAllCharacters()

    // Get the current map configuration
    const mapConfig = getMapByKey(currentMap.value)
    if (!mapConfig) return

    // Reset all hexes to default first
    for (const hex of hexes.value) {
      grid.value.setState(hex, State.DEFAULT)
    }

    // Apply the original map states
    mapConfig.grid.forEach((mapState) => {
      mapState.hex.forEach((hexId) => {
        const hex = grid.value.getHexById(hexId)
        grid.value.setState(hex, mapState.type)
      })
    })

    characterUpdateTrigger.value++ // Trigger UI reactivity
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
    debugPathfindingResults,

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

    // Map Editor
    setHexState,
    clearAllHexStates,
    resetToCurrentMap,
  }
})
