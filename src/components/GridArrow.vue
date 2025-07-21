<script setup lang="ts">
import { computed } from 'vue'
import { useGridStore } from '../stores/grid'

interface Props {
  startHexId: number
  endHexId: number
  color?: string
  strokeWidth?: number
  arrowheadSize?: number
  id?: string
}

const props = withDefaults(defineProps<Props>(), {
  color: '#ff6b6b',
  strokeWidth: 3,
  arrowheadSize: 10,
  id: '',
})

const emit = defineEmits<{
  arrowClick: [startHexId: number, endHexId: number]
}>()

const gridStore = useGridStore()

const markerId = computed(() =>
  props.id ? `arrowhead-${props.id}` : `arrowhead-${props.startHexId}-${props.endHexId}`,
)

const pathData = computed(() => {
  return gridStore.getArrowPath(props.startHexId, props.endHexId)
})
</script>

<template>
  <g class="grid-arrow">
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
.grid-arrow path {
  cursor: pointer;
}

.grid-arrow path:hover {
  stroke-opacity: 0.8;
}
</style>
