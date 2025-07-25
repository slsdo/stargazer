<script setup lang="ts">
import GridTiles from './GridTiles.vue'
import GridCharacters from './GridCharacters.vue'
import GridArrow from './GridArrow.vue'
import GridArtifacts from './GridArtifacts.vue'
import DebugGrid from './DebugGrid.vue'
import PathfindingDebug from './PathfindingDebug.vue'
import type { CharacterType } from '../lib/types/character'
import type { Hex } from '../lib/hex'
import { Team } from '../lib/types/team'
import { State } from '../lib/types/state'
import { useGridStore } from '../stores/grid'
import { useCharacterStore } from '../stores/character'
import { useMapEditorStore } from '../stores/mapEditor'
import { usePathfindingStore } from '../stores/pathfinding'
import { useArtifactStore } from '../stores/artifact'
import { computed, onMounted, inject } from 'vue'
import type { DragDropAPI } from './DragDropProvider.vue'
import { provideGridEvents } from '../composables/useGridEvents'

// Props - Added map editor support
interface Props {
  characters: readonly CharacterType[]
  characterImages: Readonly<Record<string, string>>
  artifactImages: Readonly<Record<string, string>>
  showArrows?: boolean
  showHexIds?: boolean
  showDebug?: boolean
  isMapEditorMode?: boolean
  selectedMapEditorState?: State
}

const props = withDefaults(defineProps<Props>(), {
  showArrows: true,
  showHexIds: true,
  showDebug: false,
  isMapEditorMode: false,
  selectedMapEditorState: State.DEFAULT,
})

// No emits needed

// Use stores and inject drag/drop API
const gridStore = useGridStore()
const characterStore = useCharacterStore()
const mapEditorStore = useMapEditorStore()
const pathfindingStore = usePathfindingStore()
const artifactStore = useArtifactStore()

// Provide grid events to children
const gridEvents = provideGridEvents()

// Inject the drag/drop API from provider
const dragDropAPI = inject<DragDropAPI>('dragDrop')
if (!dragDropAPI) {
  throw new Error('GridManager must be used within a DragDropProvider')
}

const {
  startDrag,
  endDrag,
  hoveredHexId,
  isDragging,
  handleDrop,
  dropHandled,
  setDropHandled,
  registerHexDetector,
  registerDropHandler,
} = dragDropAPI

// Computed
const hasCharacters = computed(() => characterStore.characterPlacements.size > 0)

// Map editor integration - handle hex clicks for painting tiles
// When in map editor mode, clicking a hex changes its state to the selected state
gridEvents.on('hex:click', (hex: Hex) => {
  if (props.isMapEditorMode) {
    const hexId = hex.getId()
    mapEditorStore.setHexState(hexId, props.selectedMapEditorState)
  }
})

/**
 * Utility function to find which hex is under the given screen coordinates
 * Uses point-in-polygon detection to accurately determine hex boundaries
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

// Grid character drag handlers
const handleCharacterDragStart = (event: DragEvent, hexId: number, characterId: string) => {
  const character = props.characters.find((c) => c.id === characterId)
  if (!character) return

  // Add sourceHexId to differentiate from character selection drags
  const characterWithSource = { ...character, sourceHexId: hexId }
  startDrag(event, characterWithSource, characterId, props.characterImages[characterId])
}

const handleCharacterDragEnd = (event: DragEvent) => {
  endDrag(event)
}

// Remove character when clicking on overlay
const handleCharacterOverlayClick = (hexId: number) => {
  gridEvents.emit('character:remove', hexId)
}

// Handle drops on detected hexes
// This is called by DragDropProvider when a drop occurs outside a hex tile
const handleDetectedHexDrop = (event: DragEvent) => {
  if (hoveredHexId.value !== null && dropHandled.value === false) {
    const hex = gridStore.getHexById(hoveredHexId.value)
    triggerHexDrop(event, hex)
  }
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
      if (characterStore.isHexOccupied(targetHexId)) {
        characterStore.swapCharacters(sourceHexId, targetHexId)
      } else {
        // Target hex is empty, use regular move
        characterStore.moveCharacter(sourceHexId, targetHexId, characterId)
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
      if (!characterStore.canPlaceCharacter(characterId, team)) {
        return
      }

      const success = characterStore.placeCharacterOnHex(hexId, characterId, team)
      if (!success) {
        return
      }
    }
  }
}

// Register hex detector and drop handler with DragDropProvider
onMounted(() => {
  registerHexDetector(findHexUnderMouse)
  registerDropHandler(handleDetectedHexDrop)
})

// Expose methods for parent components if needed
defineExpose({
  findHexUnderMouse,
})
</script>

<template>
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
            v-for="[allyHexId, enemyInfo] in pathfindingStore.closestEnemyMap"
            :key="`arrow-ally-${allyHexId}-${enemyInfo.enemyHexId}`"
            :start-hex-id="allyHexId"
            :end-hex-id="enemyInfo.enemyHexId"
            :color="'#36958e'"
            :stroke-width="3"
            :arrowhead-size="6"
          />
          <!-- Enemy to Ally arrows (red) -->
          <GridArrow
            v-for="[enemyHexId, allyInfo] in pathfindingStore.closestAllyMap"
            :key="`arrow-enemy-${enemyHexId}-${allyInfo.allyHexId}`"
            :start-hex-id="enemyHexId"
            :end-hex-id="allyInfo.allyHexId"
            :color="'#dc3545'"
            :stroke-width="3"
            :arrowhead-size="6"
            :invert-curve="true"
          />
        </g>

        <!-- Debug pathfinding paths -->
        <PathfindingDebug v-if="showDebug" />
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
        :is-map-editor-mode="isMapEditorMode"
        :selected-map-editor-state="selectedMapEditorState"
      >
        <!-- Character placements -->
        <GridCharacters
          :character-placements="characterStore.characterPlacements"
          :hexes="gridStore.hexes"
          :layout="gridStore.layout"
          :character-images="characterImages"
          :characters="characters"
        />
      </GridTiles>

      <!-- HTML overlay system for dragging grid characters -->
      <div class="character-drag-overlay" v-if="hasCharacters">
        <div
          v-for="[hexId, characterId] in characterStore.characterPlacements"
          :key="hexId"
          class="character-drag-handle"
          :class="{ 'map-editor-disabled': props.isMapEditorMode }"
          :style="{
            left: `${gridStore.getHexPosition(hexId).x - 30}px`,
            top: `${gridStore.getHexPosition(hexId).y - 30}px`,
            width: '60px',
            height: '60px',
          }"
          :draggable="!props.isMapEditorMode"
          @dragstart="handleCharacterDragStart($event, hexId, characterId)"
          @dragend="handleCharacterDragEnd($event)"
          @click="handleCharacterOverlayClick(hexId)"
        />
      </div>

      <!-- Artifact Display -->
      <GridArtifacts
        :allyArtifact="artifactStore.allyArtifact"
        :enemyArtifact="artifactStore.enemyArtifact"
        :artifactImages="artifactImages"
      />
    </div>

    <!-- Debug Panel -->
    <div v-if="showDebug" class="debug-panel">
      <DebugGrid />
    </div>
  </div>
</template>

<style scoped>
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

/* HTML overlay styles for grid character dragging */
.character-drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
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

/* Disable character overlays in map editor mode to allow hex painting */
.character-drag-handle.map-editor-disabled {
  pointer-events: none;
  cursor: default;
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
</style>
