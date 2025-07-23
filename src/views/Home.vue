<script setup lang="ts">
import CharacterSelection from '../components/CharacterSelection.vue'
import ArtifactSelection from '../components/ArtifactSelection.vue'
import GridTiles from '../components/GridTiles.vue'
import GridCharacters from '../components/GridCharacters.vue'
import GridArrow from '../components/GridArrow.vue'
import DebugGrid from '../components/DebugGrid.vue'
import TabNavigation from '../components/TabNavigation.vue'
import GridControls from '../components/GridControls.vue'
import GridArtifacts from '../components/GridArtifacts.vue'
import type { CharacterType } from '../lib/types/character'
import type { ArtifactType } from '../lib/types/artifact'
import type { Hex } from '../lib/hex'
import { Team } from '../lib/types/team'
import { State } from '../lib/types/state'
import { useGridStore } from '../stores/grid'
import { getMapNames } from '../lib/maps'
import { ref, onMounted, onUnmounted } from 'vue'
import { loadAssetsDict } from '../utils/assetLoader'
import { useDragDrop } from '../composables/useDragDrop'

// Use Pinia grid store
const gridStore = useGridStore()

// Use drag and drop composable
const {
  startDrag,
  endDrag,
  currentMousePosition,
  hoveredHexId,
  setHoveredHex,
  isDragging,
  handleDrop,
  dropHandled,
  setDropHandled,
} = useDragDrop()

/**
 * Utility function to find which hex is under the given screen coordinates
 * Uses point-in-polygon detection to accurately determine hex boundaries
 *
 * @param x - Screen X coordinate
 * @param y - Screen Y coordinate
 * @returns Hex ID if mouse is over a hex, null otherwise
 */
const findHexUnderMouse = (x: number, y: number): number | null => {
  // Get the SVG element to convert screen coordinates to SVG coordinates
  const svgElement = document.querySelector('.grid-tiles') as SVGSVGElement
  if (!svgElement) return null

  // Create SVG point for coordinate conversion
  const pt = svgElement.createSVGPoint()
  pt.x = x
  pt.y = y

  // Convert screen coordinates to SVG coordinates
  const screenCTM = svgElement.getScreenCTM()
  if (!screenCTM) return null
  const svgPt = pt.matrixTransform(screenCTM.inverse())

  // Check each hex to see if the point is inside it
  for (const hex of gridStore.hexes) {
    const hexCenter = gridStore.layout.hexToPixel(hex)
    const corners = gridStore.layout.polygonCorners(hex)

    // Point-in-polygon test
    if (isPointInPolygon({ x: svgPt.x, y: svgPt.y }, corners)) {
      return hex.getId()
    }
  }

  return null
}

/**
 * Point-in-polygon algorithm to check if a point is inside a hexagon
 * Uses ray casting algorithm
 */
const isPointInPolygon = (
  point: { x: number; y: number },
  vertices: { x: number; y: number }[],
): boolean => {
  let inside = false
  const n = vertices.length

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = vertices[i].x
    const yi = vertices[i].y
    const xj = vertices[j].x
    const yj = vertices[j].y

    if (yi > point.y !== yj > point.y && point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }

  return inside
}

// Tab state management
const activeTab = ref('characters')
const showDebug = ref(false)

// Map management
const availableMaps = getMapNames()
const selectedMap = ref('arena1')

// Grid display toggles
const showArrows = ref(true)
const showHexIds = ref(true)

const handleTabChange = (tab: string) => {
  activeTab.value = tab
}

const handleMapChange = (mapKey: string) => {
  const success = gridStore.switchMap(mapKey)
  if (success) {
    selectedMap.value = mapKey
  }
}

// Event handlers
const handleHexClick = (hex: Hex) => {
  gridStore.handleHexClick(hex)
}

const handleCharacterClick = (hexId: number, characterId: string) => {
  gridStore.removeCharacterFromHex(hexId)
}

const handleArrowClick = (startHexId: number, endHexId: number) => {
  // Arrow clicked - could add targeting logic here
}

const handleArtifactGridClick = (team: Team) => {
  gridStore.removeArtifact(team)
}

// Grid starts empty - no default character placement

const characters = (
  Object.values(
    import.meta.glob('../data/character/*.json', { eager: true, import: 'default' }),
  ) as CharacterType[]
).sort((a, b) => a.faction.localeCompare(b.faction))

// Create character ranges map and pass to store
const characterRanges = new Map<string, number>()
characters.forEach((char) => {
  characterRanges.set(char.id, char.range)
})
gridStore.setCharacterRanges(characterRanges)

const artifacts = (
  Object.values(
    import.meta.glob('../data/artifact/*.json', { eager: true, import: 'default' }),
  ) as ArtifactType[]
).sort((a, b) => a.id.localeCompare(b.id))

const characterImages = loadAssetsDict(
  import.meta.glob('../assets/images/character/*.png', {
    eager: true,
    import: 'default',
  }) as Record<string, string>,
)

const artifactImages = loadAssetsDict(
  import.meta.glob('../assets/images/artifact/*.png', {
    eager: true,
    import: 'default',
  }) as Record<string, string>,
)

const icons = loadAssetsDict(
  import.meta.glob('../assets/images/icons/*.png', { eager: true, import: 'default' }) as Record<
    string,
    string
  >,
)

/**
 * Drag and drop system combining SVG events with position-based hex detection.
 *
 * Uses HTML overlays to drag grid characters and point-in-polygon detection
 * to handle drops when character portraits block tile events. Supports automatic
 * team assignment and character swapping between occupied tiles.
 */

// Grid character drag handlers using HTML overlays
const handleCharacterDragStart = (event: DragEvent, hexId: number, characterId: string) => {
  const character = characters.find((c) => c.id === characterId)
  if (!character) return

  // Add sourceHexId to differentiate from character selection drags
  const characterWithSource = { ...character, sourceHexId: hexId }
  startDrag(event, characterWithSource, characterId, characterImages[characterId])
}

// Clean up drag state when character drag ends
const handleCharacterDragEnd = (event: DragEvent) => {
  endDrag(event)
}

// Remove character when clicking on overlay
const handleCharacterOverlayClick = (hexId: number) => {
  gridStore.handleHexClick(gridStore.getHexById(hexId))
}

// Global drop handling for characters dropped outside valid hexes
const handleGlobalDrop = (event: DragEvent) => {
  // Prevent default behavior
  event.preventDefault()

  // Check if drop was already handled by a hex tile
  if (dropHandled.value) {
    return
  }

  // Check if we detected a hex under the mouse using position-based detection
  if (hoveredHexId.value !== null) {
    // Simulate a drop on the detected hex
    const hex = gridStore.getHexById(hoveredHexId.value)
    triggerHexDrop(event, hex)
  }

  // This handler will catch drops that didn't land on a valid hex
  // The drag will automatically end and the character will remain in its original position
  // due to the logic in moveCharacter that restores on failed placement
}

// Utility function to trigger drop logic programmatically
const triggerHexDrop = (event: DragEvent, hex: any) => {
  // Use the same drop logic as GridTiles.vue
  const dropResult = handleDrop(event)

  if (dropResult) {
    const { character, characterId } = dropResult

    // Mark drop as handled
    setDropHandled(true)

    // Check if this is a character being moved from another hex (drag from grid)
    if (character.sourceHexId !== undefined) {
      const sourceHexId = character.sourceHexId
      const targetHexId = hex.getId()

      // Check if target hex is occupied - if so, swap characters
      if (gridStore.isHexOccupied(targetHexId)) {
        gridStore.swapCharacters(sourceHexId, targetHexId)
      } else {
        // Target hex is empty, use regular move
        gridStore.moveCharacter(sourceHexId, targetHexId, characterId)
      }
    } else {
      // This is a new character placement from the character selection
      const hexId = hex.getId()
      const tile = gridStore.getTile(hexId)
      const state = tile.state

      // Determine the team based on tile state
      let team: Team
      if (state === State.AVAILABLE_ALLY || state === State.OCCUPIED_ALLY) {
        team = Team.ALLY
      } else if (state === State.AVAILABLE_ENEMY || state === State.OCCUPIED_ENEMY) {
        team = Team.ENEMY
      } else {
        return
      }

      // Check if the team has space for this character
      if (!gridStore.canPlaceCharacter(characterId, team)) {
        return
      }

      const success = gridStore.placeCharacterOnHex(hexId, characterId, team)
      if (!success) {
        return
      }
    }
  }
}

// Global mouse tracking for hex detection during drag
const handleGlobalMouseMove = (event: MouseEvent) => {
  if (isDragging.value) {
    const hexId = findHexUnderMouse(event.clientX, event.clientY)
    setHoveredHex(hexId)
  }
}

// Also track during dragover events for better coverage
const handleGlobalDragOver = (event: DragEvent) => {
  // Prevent default to allow drop
  event.preventDefault()

  // Update hex detection during dragover as backup to mousemove
  if (isDragging.value) {
    const hexId = findHexUnderMouse(event.clientX, event.clientY)
    setHoveredHex(hexId)
  }
}

// Setup global event handlers
onMounted(() => {
  // Add listeners to the document body to catch drops outside the grid
  document.addEventListener('drop', handleGlobalDrop)
  document.addEventListener('dragover', handleGlobalDragOver)
  // Add mouse tracking for hex detection during drag
  document.addEventListener('mousemove', handleGlobalMouseMove)
})

onUnmounted(() => {
  // Clean up listeners
  document.removeEventListener('drop', handleGlobalDrop)
  document.removeEventListener('dragover', handleGlobalDragOver)
  document.removeEventListener('mousemove', handleGlobalMouseMove)
})
</script>

<template>
  <main>
    <div class="content">
      <div class="section">
        <div class="grid-container">
          <div id="map">
            <svg
              v-if="showArrows"
              width="600"
              height="600"
              style="position: absolute; pointer-events: none"
            >
              <!-- Arrows from ally characters to closest enemies (rendered on top of everything) -->
              <g class="arrows-layer" style="pointer-events: auto">
                <!-- Ally to Enemy arrows (teal) -->
                <GridArrow
                  v-for="[allyHexId, enemyInfo] in gridStore.closestEnemyMap"
                  :key="`arrow-ally-${allyHexId}-${enemyInfo.enemyHexId}`"
                  :start-hex-id="allyHexId"
                  :end-hex-id="enemyInfo.enemyHexId"
                  :color="'#36958e'"
                  :stroke-width="3"
                  :arrowhead-size="6"
                  @arrow-click="handleArrowClick"
                />
                <!-- Enemy to Ally arrows (red) -->
                <GridArrow
                  v-for="[enemyHexId, allyInfo] in gridStore.closestAllyMap"
                  :key="`arrow-enemy-${enemyHexId}-${allyInfo.allyHexId}`"
                  :start-hex-id="enemyHexId"
                  :end-hex-id="allyInfo.allyHexId"
                  :color="'#dc3545'"
                  :stroke-width="3"
                  :arrowhead-size="6"
                  :invert-curve="true"
                  @arrow-click="handleArrowClick"
                />
              </g>
            </svg>
            <GridTiles
              :hexes="gridStore.hexes"
              :layout="gridStore.layout"
              :width="600"
              :height="600"
              :rotation="0"
              :center-x="gridStore.gridOrigin.x"
              :center-y="gridStore.gridOrigin.y"
              :text-rotation="30"
              :show-hex-ids="showHexIds"
              :show-coordinates="showDebug"
              @hex-click="handleHexClick"
            >
              <!-- Character placements -->
              <GridCharacters
                :character-placements="gridStore.characterPlacements"
                :hexes="gridStore.hexes"
                :layout="gridStore.layout"
                :character-images="characterImages"
                :characters="characters"
                @character-click="handleCharacterClick"
              />
            </GridTiles>

            <!-- HTML overlay system for dragging grid characters -->
            <div class="character-drag-overlay" v-if="gridStore.characterPlacements.size > 0">
              <div
                v-for="[hexId, characterId] in gridStore.characterPlacements"
                :key="hexId"
                class="character-drag-handle"
                :style="{
                  left: `${gridStore.getHexPosition(hexId).x - 30}px`,
                  top: `${gridStore.getHexPosition(hexId).y - 30}px`,
                  width: '60px',
                  height: '60px',
                }"
                :draggable="true"
                @dragstart="handleCharacterDragStart($event, hexId, characterId)"
                @dragend="handleCharacterDragEnd($event)"
                @click="handleCharacterOverlayClick(hexId)"
              />
            </div>

            <!-- Artifact Display -->
            <GridArtifacts
              :allyArtifact="gridStore.allyArtifact"
              :enemyArtifact="gridStore.enemyArtifact"
              :artifactImages="artifactImages"
              @artifact-click="handleArtifactGridClick"
            />
          </div>

          <!-- Debug Panel -->
          <div v-if="showDebug" class="debug-panel">
            <DebugGrid />
          </div>
        </div>

        <!-- Grid Display Toggle -->
        <GridControls
          :showDebug="showDebug"
          :showArrows="showArrows"
          :showHexIds="showHexIds"
          @update:showDebug="showDebug = $event"
          @update:showArrows="showArrows = $event"
          @update:showHexIds="showHexIds = $event"
        />
      </div>

      <!-- Tab Navigation -->
      <TabNavigation
        :activeTab="activeTab"
        :availableMaps="availableMaps"
        :selectedMap="selectedMap"
        @tab-change="handleTabChange"
        @map-change="handleMapChange"
      >
        <!-- Tab Content -->
        <!-- Characters Tab -->
        <div v-show="activeTab === 'characters'" class="tab-panel">
          <CharacterSelection
            :characters="characters"
            :characterImages="characterImages"
            :icons="icons"
            :isDraggable="true"
          />
        </div>
        <!-- Artifacts Tab -->
        <div v-show="activeTab === 'artifacts'" class="tab-panel">
          <ArtifactSelection
            :artifacts="artifacts"
            :artifactImages="artifactImages"
            :icons="icons"
          />
        </div>
      </TabNavigation>
    </div>
  </main>
</template>

<style scoped>
/* HTML overlay styles for grid character dragging */
/* Container for character drag overlays */
.character-drag-overlay {
  position: absolute; /* Positioned relative to the grid container */
  top: 0;
  left: 0;
  pointer-events: none; /* Container doesn't intercept events, only children do */
}

/* Invisible draggable handles positioned over each character */
.character-drag-handle {
  position: absolute;
  border-radius: 50%;
  cursor: grab;
  pointer-events: all;
  z-index: 10;
}

.character-drag-handle:active {
  cursor: grabbing;
}
main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: var(--spacing-2xl) 0;
}

.content {
  max-width: 1280px;
  width: 100%;
  padding: 0 2em;
  text-align: center;
}

.section {
  padding: 2em;
  margin: 0 0 var(--spacing-2xl);
  color: var(--color-text-muted);
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-large);
}

.grid-container {
  display: flex;
  gap: var(--spacing-2xl);
  justify-content: center;
  align-items: flex-start;
}

#map {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.debug-panel {
  background: var(--color-bg-white);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--radius-large);
  padding: var(--spacing-xl);
  max-width: 500px;
  max-height: 600px;
  overflow-y: auto;
}

.tab-panel {
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}
</style>
