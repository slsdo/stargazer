<script setup lang="ts">
import { useGridStore } from '../stores/grid'
import type { Hex } from '../lib/hex'
import type { Layout } from '../lib/layout'
import type { CharacterType } from '../lib/types/character'

interface Props {
  characterPlacements: Map<number, string>
  hexes: Hex[]
  layout: Layout
  characterImages: Readonly<Record<string, string>>
  characters: readonly CharacterType[]
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
  innerRadius: 27,
  borderWidth: 3,
  innerBorderWidth: 3,
  backgroundColor: '#fff',
  backgroundOpacity: 0.7,
  borderColor: '#fff',
  overlayColor: '#fff',
  overlayOpacity: 0,
  showOverlay: true,
})

// Access Pinia grid store
const gridStore = useGridStore()

const emit = defineEmits<{
  characterClick: [hexId: number, characterName: string]
}>()

const hexExists = (hexId: number): boolean => {
  try {
    gridStore.getHexById(hexId)
    return true
  } catch {
    return false
  }
}

const getCharacterLevel = (characterName: string): 's' | 'a' => {
  const character = props.characters.find((c) => c.name === characterName)
  return (character?.level as 's' | 'a') || 'a'
}

const getBackgroundColor = (characterName: string): string => {
  const level = getCharacterLevel(characterName)
  return level === 's' ? '#facd7e' : '#a78fc5'
}
</script>

<template>
  <g class="grid-characters-container">
    <!-- SVG elements for visual display -->
    <g v-for="[hexId, characterName] in characterPlacements" :key="hexId" class="grid-characters">
      <g v-if="hexExists(hexId)">
        <!-- Clipping mask for character image -->
        <defs>
          <clipPath :id="`clip-grid-character-${hexId}`">
            <circle
              :cx="gridStore.getHexPosition(hexId).x"
              :cy="gridStore.getHexPosition(hexId).y"
              :r="innerRadius"
            />
          </clipPath>
        </defs>
        <!-- Background circle -->
        <circle
          :cx="gridStore.getHexPosition(hexId).x"
          :cy="gridStore.getHexPosition(hexId).y"
          :r="outerRadius"
          :fill="getBackgroundColor(characterName)"
          :fill-opacity="backgroundOpacity"
          :stroke="getBackgroundColor(characterName)"
          :stroke-width="borderWidth"
        />
        <!-- Character image (clipped to inner circle) -->
        <image
          :href="characterImages[characterName]"
          :x="gridStore.getHexPosition(hexId).x - outerRadius"
          :y="gridStore.getHexPosition(hexId).y - outerRadius"
          :width="outerRadius * 2"
          :height="outerRadius * 2"
          :clip-path="`url(#clip-grid-character-${hexId})`"
          class="character-image"
        />
        <!-- Inner border circle (drawn on top) -->
        <circle
          :cx="gridStore.getHexPosition(hexId).x"
          :cy="gridStore.getHexPosition(hexId).y"
          :r="innerRadius"
          fill="none"
          :stroke="borderColor"
          :stroke-width="innerBorderWidth"
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
  </g>
</template>

<style scoped>
/* 
 * Disable pointer events on all character visual elements to allow 
 * drag and drop events to pass through to the hex tiles underneath.
 * The HTML overlay in Home.vue handles character dragging instead.
 */
.character-image {
  pointer-events: none;
}

/* Ensure all SVG elements in character display don't block hex tile events */
.grid-characters * {
  pointer-events: none;
}
</style>
