<script setup lang="ts">
import { computed } from 'vue'
import type { Hex } from '../../lib/Hex'
import type { Layout } from '../../lib/Layout'

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
}>()

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
</script>

<template>
  <svg :width="width" :height="height" class="hex-grid">
    <defs>
      <slot name="defs" />
    </defs>
    <g :transform="gridTransform">
      <g v-for="hex in hexes" :key="hex.getId()" class="hex-tile">
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
</style>
