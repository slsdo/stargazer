<script setup lang="ts">
import { computed } from 'vue'
import type { Hex } from '../../lib/Hex'
import type { Layout } from '../../lib/Layout'

interface Props {
  startHexId: number
  endHexId: number
  hexes: Hex[]
  layout: Layout
  color?: string
  strokeWidth?: number
  curvature?: number
  arrowheadSize?: number
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: '#ff6b6b',
  strokeWidth: 3,
  curvature: 0.3,
  arrowheadSize: 10,
  id: '',
})

const emit = defineEmits<{
  arrowClick: [startHexId: number, endHexId: number]
}>()

const markerId = computed(() =>
  props.id ? `arrowhead-${props.id}` : `arrowhead-${props.startHexId}-${props.endHexId}`,
)

const getHexById = (id: number): Hex | undefined => {
  return props.hexes.find((hex) => hex.getId() === id)
}

const pathData = computed(() => {
  const startHex = getHexById(props.startHexId)
  const endHex = getHexById(props.endHexId)

  if (!startHex || !endHex) {
    return ''
  }

  const start = props.layout.hexToPixel(startHex)
  const end = props.layout.hexToPixel(endHex)

  // Calculate control point for curve (offset perpendicular to line)
  const midX = (start.x + end.x) / 2
  const midY = (start.y + end.y) / 2
  const dx = end.x - start.x
  const dy = end.y - start.y
  const length = Math.sqrt(dx * dx + dy * dy)
  const curvature = length * props.curvature

  // Perpendicular offset for control point
  const controlX = midX - (dy / length) * curvature
  const controlY = midY + (dx / length) * curvature

  return `M ${start.x} ${start.y} Q ${controlX} ${controlY} ${end.x} ${end.y}`
})
</script>

<template>
  <g class="hex-arrow">
    <defs>
      <marker
        :id="markerId"
        :markerWidth="arrowheadSize"
        :markerHeight="arrowheadSize * 0.7"
        :refX="arrowheadSize - 1"
        :refY="arrowheadSize * 0.35"
        orient="auto"
      >
        <polygon
          :points="`0 0, ${arrowheadSize} ${arrowheadSize * 0.35}, 0 ${arrowheadSize * 0.7}`"
          :fill="color"
        />
      </marker>
    </defs>
    <path
      v-if="pathData"
      :d="pathData"
      :stroke="color"
      :stroke-width="strokeWidth"
      fill="none"
      :marker-end="`url(#${markerId})`"
      @click="$emit('arrowClick', startHexId, endHexId)"
    />
  </g>
</template>

<style scoped>
.hex-arrow path {
  cursor: pointer;
}

.hex-arrow path:hover {
  stroke-opacity: 0.8;
}
</style>
