<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue'
import type { Hex } from '../../lib/Hex'
import type { Layout } from '../../lib/Layout'
import { useDragDrop } from '../../composables/useDragDrop'
import { useGridStore } from '../../stores/grid'

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
  hexStrokeColor: '#222',
})

const emit = defineEmits<{
  hexClick: [hex: Hex]
  characterDropped: [hex: Hex, character: any, imageSrc: string]
}>()

const { handleDragOver, handleDrop, hasCharacterData } = useDragDrop()
const gridStore = useGridStore()

// Track which hex is currently being hovered during drag
const dragHoveredHex = ref<number | null>(null)

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
  return props.hexFillColor
}

const getHexStroke = (hex: Hex) => {
  return props.hexStrokeColor
}

// Drop handling functions
const handleHexDragOver = (event: DragEvent, hex: Hex) => {
  if (hasCharacterData(event)) {
    handleDragOver(event)
    dragHoveredHex.value = hex.getId()
  }
}

const handleHexDragLeave = (event: DragEvent, hex: Hex) => {
  // Only clear hover if we're actually leaving this hex (not entering a child element)
  if (dragHoveredHex.value === hex.getId()) {
    dragHoveredHex.value = null
  }
}

const handleHexDrop = (event: DragEvent, hex: Hex) => {
  console.log('Drop detected on hex:', hex.getId())
  const dropResult = handleDrop(event)
  console.log('Drop result:', dropResult)

  // Clear hover state on drop
  dragHoveredHex.value = null

  if (dropResult) {
    const { character, imageSrc } = dropResult
    console.log('Placing character on hex:', hex.getId(), character.id)

    // Check if this is a character being moved from another hex
    if (character.sourceHexId !== undefined) {
      const sourceHexId = character.sourceHexId
      const targetHexId = hex.getId()
      
      // Don't do anything if dropping on the same hex
      if (sourceHexId === targetHexId) {
        return
      }
      
      // Move character from source to target hex
      gridStore.removeCharacterFromHex(sourceHexId)
      gridStore.placeCharacterOnHex(targetHexId, imageSrc)
      
      console.log('Moved character from hex', sourceHexId, 'to hex', targetHexId)
    } else {
      // This is a new character placement from the character selection
      gridStore.placeCharacterOnHex(hex.getId(), imageSrc)
    }

    // Emit event for any additional handling
    emit('characterDropped', hex, character, imageSrc)
  } else {
    console.log('No valid drop result')
  }
}

const getHexDropClass = (hex: Hex) => {
  return {
    'drop-target': true,
    occupied: gridStore.isHexOccupied(hex.getId()),
    'drag-hover': dragHoveredHex.value === hex.getId(),
  }
}

const isElevated = (hex: Hex) => {
  return gridStore.isHexOccupied(hex.getId())
}

const regularHexes = computed(() => props.hexes.filter((hex) => !isElevated(hex)))
const elevatedHexes = computed(() => props.hexes.filter((hex) => isElevated(hex)))

// Clear hover state when drag ends globally
const handleDragEnded = () => {
  dragHoveredHex.value = null
}

onMounted(() => {
  document.addEventListener('drag-ended', handleDragEnded)
})

onUnmounted(() => {
  document.removeEventListener('drag-ended', handleDragEnded)
})
</script>

<template>
  <svg :width="width" :height="height" class="hex-grid">
    <defs>
      <slot name="defs" />
    </defs>
    <g :transform="gridTransform">
      <!-- Regular hexes (render first, behind elevated hexes) -->
      <g
        v-for="hex in regularHexes"
        :key="hex.getId()"
        class="hex-tile"
        :class="getHexDropClass(hex)"
      >
        <polygon
          :points="
            layout
              .polygonCorners(hex)
              .map((p) => `${p.x},${p.y}`)
              .join(' ')
          "
          :fill="getHexFill(hex)"
          :stroke="getHexStroke(hex)"
          :stroke-width="strokeWidth"
          @click="$emit('hexClick', hex)"
          @dragover="handleHexDragOver($event, hex)"
          @dragleave="handleHexDragLeave($event, hex)"
          @drop="handleHexDrop($event, hex)"
        />
        <text
          v-if="showHexIds"
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
      <g
        v-for="hex in elevatedHexes"
        :key="`elevated-${hex.getId()}`"
        class="hex-tile"
        :class="getHexDropClass(hex)"
      >
        <polygon
          :points="
            layout
              .polygonCorners(hex)
              .map((p) => `${p.x},${p.y}`)
              .join(' ')
          "
          :fill="getHexFill(hex)"
          :stroke="getHexStroke(hex)"
          :stroke-width="strokeWidth"
          @click="$emit('hexClick', hex)"
          @dragover="handleHexDragOver($event, hex)"
          @dragleave="handleHexDragLeave($event, hex)"
          @drop="handleHexDrop($event, hex)"
        />
        <text
          v-if="showHexIds"
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

      <!-- Character components and other content (render on top of everything) -->
      <slot />
    </g>
  </svg>
</template>

<style scoped>
.hex-grid {
  max-width: 100%;
  height: auto;
}

.hex-tile {
  cursor: pointer;
}

.hex-tile:hover polygon {
  fill-opacity: 0.8;
}

.drop-target polygon {
  transition:
    fill 0.2s ease,
    stroke 0.2s ease,
    stroke-width 0.2s ease;
}

/* Occupied tiles - red border */
.drop-target.occupied polygon {
  fill: #ffe8e8;
  stroke: #f44336;
  stroke-width: 3;
}

/* Drag hover states - highest priority with !important */
.drop-target.drag-hover:not(.occupied) polygon {
  fill: #e8f5e8 !important;
  stroke: #4caf50 !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px rgba(76, 175, 80, 0.4));
}

.drop-target.drag-hover.occupied polygon {
  fill: #ffe8e8 !important;
  stroke: #f44336 !important;
  stroke-width: 3 !important;
  filter: drop-shadow(0 0 8px rgba(244, 67, 54, 0.4));
}

/* Regular hover (when not dragging) */
.drop-target:not(.occupied):not(.drag-hover):hover polygon {
  fill: #f0f8f0;
  stroke: #81c784;
  stroke-width: 3;
}
</style>
