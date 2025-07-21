<script setup lang="ts">
import { useGridStore } from '../stores/grid'
import type { Hex } from '../lib/hex'
import type { Layout } from '../lib/layout'
import type { CharacterType } from '../types/character'

interface Props {
  characterPlacements: Map<number, string>
  hexes: Hex[]
  layout: Layout
  characterImages: { [key: string]: string }
  characters: CharacterType[]
  outerRadius?: number
  innerRadius?: number
  borderWidth?: number
  innerBorderWidth?: number
  backgroundColor?: string
  backgroundOpacity?: number
  borderColor?: string
  overlayColor?: string
  overlayOpacity?: number
  showOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  outerRadius: 30,
  innerRadius: 30,
  borderWidth: 3,
  innerBorderWidth: 3,
  backgroundColor: '#fff',
  backgroundOpacity: 0.7,
  borderColor: '#777',
  overlayColor: '#fff',
  overlayOpacity: 0,
  showOverlay: true,
})

// Access Pinia grid store
const gridStore = useGridStore()

const emit = defineEmits<{
  characterClick: [hexId: number, characterId: string]
}>()

const hexExists = (hexId: number): boolean => {
  try {
    gridStore.getHexById(hexId)
    return true
  } catch {
    return false
  }
}

const getCharacterLevel = (characterId: string): 's' | 'a' => {
  const character = props.characters.find((c) => c.id === characterId)
  return (character?.level as 's' | 'a') || 'a'
}

const getBackgroundColor = (characterId: string): string => {
  const level = getCharacterLevel(characterId)
  return level === 's' ? '#facd7e' : '#a78fc5'
}
</script>

<template>
  <g v-for="[hexId, characterId] in characterPlacements" :key="hexId" class="grid-characters">
    <g v-if="hexExists(hexId)">
      <!-- Background circle -->
      <circle
        :cx="gridStore.getHexPosition(hexId).x"
        :cy="gridStore.getHexPosition(hexId).y"
        :r="outerRadius"
        :fill="getBackgroundColor(characterId)"
        :fill-opacity="backgroundOpacity"
        :stroke="getBackgroundColor(characterId)"
        :stroke-width="borderWidth"
      />
      <!-- Inner border circle -->
      <circle
        :cx="gridStore.getHexPosition(hexId).x"
        :cy="gridStore.getHexPosition(hexId).y"
        :r="innerRadius"
        fill="none"
        :stroke="borderColor"
        :stroke-width="innerBorderWidth"
      />
      <!-- Character image (clipped to circle) -->
      <defs>
        <clipPath :id="`clip-grid-character-${hexId}`">
          <circle
            :cx="gridStore.getHexPosition(hexId).x"
            :cy="gridStore.getHexPosition(hexId).y"
            :r="innerRadius"
          />
        </clipPath>
      </defs>
      <!-- Character image (clipped to circle) -->
      <image
        :href="characterImages[characterId]"
        :x="gridStore.getHexPosition(hexId).x - innerRadius"
        :y="gridStore.getHexPosition(hexId).y - innerRadius"
        :width="innerRadius * 2"
        :height="innerRadius * 2"
        :clip-path="`url(#clip-grid-character-${hexId})`"
      />
      <!-- Semi-transparent overlay -->
      <circle
        v-if="showOverlay"
        :cx="gridStore.getHexPosition(hexId).x"
        :cy="gridStore.getHexPosition(hexId).y"
        :r="innerRadius"
        :fill="overlayColor"
        :fill-opacity="overlayOpacity"
        style="pointer-events: none"
      />
    </g>
  </g>
</template>

<style scoped>
.grid-characters image {
  pointer-events: none;
}
</style>
