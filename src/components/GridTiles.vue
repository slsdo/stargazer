<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { Hex } from '../lib/hex'
import type { Layout } from '../lib/layout'
import { useDragDrop } from '../composables/useDragDrop'
import { useGridStore } from '../stores/grid'
import { State } from '../lib/types/state'
import { getHexFillColor } from '../utils/stateFormatting'
import { Team } from '../lib/types/team'
import { watch } from 'vue'

interface Props {
  hexes: Hex[]
  layout: Layout
  width?: number | string
  height?: number | string
  rotation?: number
  scaleX?: number
  scaleY?: number
  skewX?: number
  skewY?: number
  centerX?: number
  centerY?: number
  strokeWidth?: number
  showHexIds?: boolean
  showCoordinates?: boolean
  hexIdFontSize?: number
  coordinateFontSize?: number
  textColor?: string
  coordinateColor?: string
  textRotation?: number
  hexFillColor?: string
  hexStrokeColor?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 500,
  height: 500,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
  centerX: 250,
  centerY: 250,
  strokeWidth: 2,
  showHexIds: true,
  showCoordinates: true,
  hexIdFontSize: 18,
  coordinateFontSize: 8,
  textColor: '#222',
  coordinateColor: '#555',
  textRotation: 0,
  hexFillColor: '#fff',
  hexStrokeColor: '#ccc',
})

const emit = defineEmits<{
  hexClick: [hex: Hex]
  characterDropped: [hex: Hex, character: any, characterId: string]
}>()

const {
  handleDragOver,
  handleDrop,
  hasCharacterData,
  draggedCharacter,
  hoveredHexId,
  isDragging,
  setHoveredHex,
  setDropHandled,
} = useDragDrop()
const gridStore = useGridStore()

// Track which hex is currently being hovered (non-drag)
const hoveredHex = ref<number | null>(null)

// Watch for changes in position-based hex detection
watch(hoveredHexId, (newHexId) => {
  if (isDragging.value && newHexId !== null) {
    // Trigger drop validation for the detected hex
    const hex = gridStore.getHexById(newHexId)
    // We could emit drag over events here if needed
  }
})

const gridTransform = computed(() => {
  const transforms: string[] = []
  if (props.rotation !== 0) {
    transforms.push(`rotate(${props.rotation},${props.centerX},${props.centerY})`)
  }
  if (props.skewX !== 0) {
    transforms.push(`skewX(${props.skewX})`)
  }
  if (props.skewY !== 0) {
    transforms.push(`skewY(${props.skewY})`)
  }
  if (props.scaleX !== 1 || props.scaleY !== 1) {
    transforms.push(`scale(${props.scaleX},${props.scaleY})`)
  }
  return transforms.join(' ')
})

const textTransform = (hex: Hex) => {
  if (props.textRotation === 0) return ''
  const pos = props.layout.hexToPixel(hex)
  return `rotate(${props.textRotation},${pos.x},${pos.y})`
}

const getHexFill = (hex: Hex) => {
  const state = gridStore.grid.getState(hex)

  return getHexFillColor(state) || props.hexFillColor
}

const shouldShowHexId = (hex: Hex) => {
  const state = gridStore.grid.getState(hex)
  return state !== State.BLOCKED
}

// Mouse hover handling functions
const handleHexMouseEnter = (hex: Hex) => {
  hoveredHex.value = hex.getId()
}

const handleHexMouseLeave = (hex: Hex) => {
  if (hoveredHex.value === hex.getId()) {
    hoveredHex.value = null
  }
}

/**
 * Hybrid drag detection: combines SVG events with position-based detection
 * to handle drops when character portraits block tile events.
 */
const handleHexDragOver = (event: DragEvent, hex: Hex) => {
  if (hasCharacterData(event)) {
    handleDragOver(event)
    // Sync with global hover state for visual feedback
    setHoveredHex(hex.getId())
  }
}

const handleHexDragLeave = (event: DragEvent, hex: Hex) => {
  // Only clear if position detection confirms we left this hex
  const currentDetectedHex = hoveredHexId.value
  if (currentDetectedHex !== hex.getId()) {
    setHoveredHex(null)
  }
}

const handleHexDrop = (event: DragEvent, hex: Hex) => {
  // Prevent event from bubbling up to global handlers
  event.stopPropagation()
  event.preventDefault()

  const dropResult = handleDrop(event)

  // Hover state is managed by position-based detection

  if (dropResult) {
    const { character, characterId } = dropResult

    setDropHandled(true) // Prevent duplicate processing

    // Grid-to-grid character moves have sourceHexId from overlay drag handlers
    if (character.sourceHexId !== undefined) {
      const sourceHexId = character.sourceHexId
      const targetHexId = hex.getId()

      // Swap if target is occupied, otherwise move
      if (gridStore.isHexOccupied(targetHexId)) {
        const swapped = gridStore.swapCharacters(sourceHexId, targetHexId)
        if (swapped) {
        } else {
        }
      } else {
        // Empty target - regular move
        const moved = gridStore.moveCharacter(sourceHexId, targetHexId, characterId)
        if (moved) {
        }
      }
    } else {
      // Character selection placement
      const hexId = hex.getId()
      const tile = gridStore.getTile(hexId)
      const state = tile.state

      // Auto-assign team based on tile state
      let team: Team
      if (state === State.AVAILABLE_ALLY || state === State.OCCUPIED_ALLY) {
        team = Team.ALLY
      } else if (state === State.AVAILABLE_ENEMY || state === State.OCCUPIED_ENEMY) {
        team = Team.ENEMY
      } else {
        return
      }

      // Validate team capacity
      if (!gridStore.canPlaceCharacter(characterId, team)) {
        return
      }

      const success = gridStore.placeCharacterOnHex(hexId, characterId, team)
      if (!success) {
        return
      }
    }

    // Notify parent components
    emit('characterDropped', hex, character, characterId)
  } else {
  }
}

const getHexDropClass = (hex: Hex) => {
  const hexId = hex.getId()
  const isOccupied = gridStore.isHexOccupied(hexId)
  // Use position-based hover detection instead of SVG event-based detection
  const isDragHover = isDragging.value && hoveredHexId.value === hexId

  // Validate drop zone for visual feedback
  let validDropZone = false
  if (isDragHover && draggedCharacter.value) {
    const tile = gridStore.getTile(hexId)
    const state = tile.state

    // Check if tile accepts characters
    if (
      state === State.AVAILABLE_ALLY ||
      state === State.OCCUPIED_ALLY ||
      state === State.AVAILABLE_ENEMY ||
      state === State.OCCUPIED_ENEMY
    ) {
      // Get tile team for validation
      const tileTeam =
        state === State.AVAILABLE_ALLY || state === State.OCCUPIED_ALLY ? Team.ALLY : Team.ENEMY

      // Grid moves: always allow (just repositioning existing characters)
      if (draggedCharacter.value.sourceHexId !== undefined) {
        // This is a character being moved from another hex on the grid
        validDropZone = true
      } else {
        // Character selection: check team capacity
        validDropZone = gridStore.canPlaceCharacter(draggedCharacter.value.id, tileTeam)
      }
    }
  }

  return {
    'drop-target': true,
    occupied: isOccupied,
    'drag-hover': isDragHover,
    'invalid-drop': isDragHover && !validDropZone,
    hover: hoveredHex.value === hexId,
  }
}

const isElevated = (hex: Hex) => {
  return gridStore.isHexOccupied(hex.getId())
}

const regularHexes = computed(() => props.hexes.filter((hex) => !isElevated(hex)))
const elevatedHexes = computed(() => props.hexes.filter((hex) => isElevated(hex)))

// Hover state is now managed by position-based detection
const handleDragEnded = () => {
  // No longer needed - position-based system handles cleanup
}

onMounted(() => {
  document.addEventListener('drag-ended', handleDragEnded)
})

onUnmounted(() => {
  document.removeEventListener('drag-ended', handleDragEnded)
})
</script>

<template>
  <svg :width="width" :height="height" class="grid-tiles">
    <defs>
      <slot name="defs" />
    </defs>
    <g :transform="gridTransform">
      <!-- Regular hexes (render first, behind elevated hexes) -->
      <g v-for="hex in regularHexes" :key="hex.getId()" class="grid-tile">
        <polygon
          :points="
            layout
              .polygonCorners(hex)
              .map((p) => `${p.x},${p.y}`)
              .join(' ')
          "
          :fill="getHexFill(hex)"
          :stroke="hexStrokeColor"
          :stroke-width="strokeWidth"
        />
        <text
          v-if="showHexIds && shouldShowHexId(hex)"
          :x="layout.hexToPixel(hex).x"
          :y="layout.hexToPixel(hex).y + 6"
          text-anchor="middle"
          :font-size="hexIdFontSize"
          :fill="textColor"
          font-family="monospace"
          :transform="textTransform(hex)"
        >
          {{ hex.getId() }}
        </text>
        <text
          v-if="showCoordinates"
          :x="layout.hexToPixel(hex).x"
          :y="layout.hexToPixel(hex).y + 18"
          text-anchor="middle"
          :font-size="coordinateFontSize"
          :fill="coordinateColor"
          font-family="monospace"
          :transform="textTransform(hex)"
        >
          ({{ hex.q }},{{ hex.r }},{{ hex.s }})
        </text>
      </g>

      <!-- Elevated hexes (render above regular hexes, but below character components) -->
      <g v-for="hex in elevatedHexes" :key="`elevated-${hex.getId()}`" class="grid-tile">
        <polygon
          :points="
            layout
              .polygonCorners(hex)
              .map((p) => `${p.x},${p.y}`)
              .join(' ')
          "
          :fill="getHexFill(hex)"
          :stroke="hexStrokeColor"
          :stroke-width="strokeWidth"
        />
        <text
          v-if="showHexIds && shouldShowHexId(hex)"
          :x="layout.hexToPixel(hex).x"
          :y="layout.hexToPixel(hex).y + 6"
          text-anchor="middle"
          :font-size="hexIdFontSize"
          :fill="textColor"
          font-family="monospace"
          :transform="textTransform(hex)"
        >
          {{ hex.getId() }}
        </text>
        <text
          v-if="showCoordinates"
          :x="layout.hexToPixel(hex).x"
          :y="layout.hexToPixel(hex).y + 18"
          text-anchor="middle"
          :font-size="coordinateFontSize"
          :fill="coordinateColor"
          font-family="monospace"
          :transform="textTransform(hex)"
        >
          ({{ hex.q }},{{ hex.r }},{{ hex.s }})
        </text>
      </g>

      <!-- Character components and other content -->
      <slot />

      <!-- 
        Invisible event layer - MUST be rendered last to be topmost layer
        This ensures drag and drop events are captured even when hovering over characters
        All character visual elements have pointer-events: none to allow events to pass through
      -->
      <g
        v-for="hex in hexes"
        :key="`event-${hex.getId()}`"
        class="grid-event-layer"
        :class="getHexDropClass(hex)"
      >
        <polygon
          :points="
            layout
              .polygonCorners(hex)
              .map((p) => `${p.x},${p.y}`)
              .join(' ')
          "
          fill="transparent"
          stroke="transparent"
          stroke-width="0"
          @click="$emit('hexClick', hex)"
          @mouseenter="handleHexMouseEnter(hex)"
          @mouseleave="handleHexMouseLeave(hex)"
          @dragover="handleHexDragOver($event, hex)"
          @dragleave="handleHexDragLeave($event, hex)"
          @drop="handleHexDrop($event, hex)"
        />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.grid-tiles {
  max-width: 100%;
  height: auto;
}

.grid-tile {
  cursor: pointer;
}

.grid-event-layer {
  cursor: pointer;
  pointer-events: all;
  /* Ensure event layer can receive drop events even with HTML overlays above */
}

/* Ensure event layer polygons can receive all pointer events including drops */
.grid-event-layer polygon {
  pointer-events: all;
  transition:
    fill 0.2s ease,
    stroke 0.2s ease,
    stroke-width 0.2s ease;
}

/* Occupied tiles - red border on event layer */
.grid-event-layer.drop-target.occupied polygon {
  stroke: #999;
  stroke-width: 3;
}

/* Drag hover states - highest priority with !important */
.grid-event-layer.drop-target.drag-hover:not(.occupied):not(.invalid-drop) polygon {
  fill: rgba(232, 245, 232, 0.3) !important;
  stroke: #36958e !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px rgba(76, 175, 80, 0.4));
}

.grid-event-layer.drop-target.drag-hover.occupied:not(.invalid-drop) polygon {
  fill: rgba(255, 232, 232, 0.3) !important;
  stroke: #ff9800 !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px rgba(255, 152, 0, 0.4));
}

/* Invalid drop zone styling */
.grid-event-layer.drop-target.drag-hover.invalid-drop polygon {
  fill: rgba(255, 193, 193, 0.3) !important;
  stroke: #c05b4d !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px rgba(244, 67, 54, 0.4));
}

/* Regular hover (when not dragging) */
.grid-event-layer.drop-target:not(.occupied):not(.drag-hover).hover polygon {
  fill: rgba(240, 248, 240, 0.3);
  stroke: #36958e;
  stroke-width: 3;
}

/* Visual grid tiles remain clean without interaction styling */
.grid-tile.hover polygon {
  fill-opacity: 0.8;
}
</style>
