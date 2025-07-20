<script setup lang="ts">
import { useGridStore } from '../../stores/grid'
import type { Hex } from '../../lib/Hex'
import type { Layout } from '../../lib/Layout'
import { useDragDrop } from '../../composables/useDragDrop'

interface Props {
  characterPlacements: Map<number, string>
  hexes: Hex[]
  layout: Layout
  characterImages: { [key: string]: string }
  outerRadius?: number
  innerRadius?: number
  borderWidth?: number
  innerBorderWidth?: number
  backgroundColor?: string
  borderColor?: string
  overlayColor?: string
  overlayOpacity?: number
  showOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  outerRadius: 31,
  innerRadius: 28,
  borderWidth: 3,
  innerBorderWidth: 2,
  backgroundColor: '#fff',
  borderColor: '#484848',
  overlayColor: '#fff',
  overlayOpacity: 0,
  showOverlay: true,
})

// Access Pinia grid store
const gridStore = useGridStore()

const emit = defineEmits<{
  characterClick: [hexId: number, characterId: string]
  characterMoved: [fromHexId: number, toHexId: number, characterId: string]
}>()

const { startDrag, endDrag } = useDragDrop()

const getHexById = (id: number): Hex | undefined => {
  return props.hexes.find((hex) => hex.getId() === id)
}

const getHexPosition = (hexId: number) => {
  const hex = getHexById(hexId)
  return hex ? props.layout.hexToPixel(hex) : { x: 0, y: 0 }
}
</script>

<template>
  <g v-for="[hexId, characterId] in characterPlacements" :key="hexId" class="character-placement">
    <g v-if="getHexById(hexId)">
      <!-- Background circle -->
      <circle
        :cx="getHexPosition(hexId).x"
        :cy="getHexPosition(hexId).y"
        :r="outerRadius"
        :fill="backgroundColor"
        :stroke="backgroundColor"
        :stroke-width="borderWidth"
      />
      <!-- Inner border circle -->
      <circle
        :cx="getHexPosition(hexId).x"
        :cy="getHexPosition(hexId).y"
        :r="innerRadius"
        fill="none"
        :stroke="borderColor"
        :stroke-width="innerBorderWidth"
      />
      <!-- Character image (clipped to circle) -->
      <defs>
        <clipPath :id="`clip-character-${hexId}`">
          <circle :cx="getHexPosition(hexId).x" :cy="getHexPosition(hexId).y" :r="innerRadius" />
        </clipPath>
      </defs>
      <!-- Character image (clipped to circle) -->
      <image
        :href="characterImages[characterId]"
        :x="getHexPosition(hexId).x - innerRadius"
        :y="getHexPosition(hexId).y - innerRadius"
        :width="innerRadius * 2"
        :height="innerRadius * 2"
        :clip-path="`url(#clip-character-${hexId})`"
        @click="$emit('characterClick', hexId, characterId)"
      />
      <!-- Semi-transparent overlay -->
      <circle
        v-if="showOverlay"
        :cx="getHexPosition(hexId).x"
        :cy="getHexPosition(hexId).y"
        :r="innerRadius"
        :fill="overlayColor"
        :fill-opacity="overlayOpacity"
      />
    </g>
  </g>
</template>

<style scoped>
.character-placement image {
  cursor: pointer;
  pointer-events: all;
}

.character-placement image:hover {
  opacity: 0.8;
}
</style>
