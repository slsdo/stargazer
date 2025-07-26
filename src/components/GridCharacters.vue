<script setup lang="ts">
import { useGridStore } from '../stores/grid'
import { useGameDataStore } from '../stores/gameData'
import type { Hex } from '../lib/hex'
import type { Layout } from '../lib/layout'
import type { CharacterType } from '../lib/types/character'

interface Props {
  characterPlacements: Map<number, number>
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
const gameDataStore = useGameDataStore()

const emit = defineEmits<{
  characterClick: [hexId: number, characterId: number]
}>()

const hexExists = (hexId: number): boolean => {
  try {
    gridStore.getHexById(hexId)
    return true
  } catch {
    return false
  }
}

const getCharacterLevel = (characterId: number): 's' | 'a' => {
  const character = props.characters.find((c) => c.id === characterId)
  return (character?.level as 's' | 'a') || 'a'
}

const getBackgroundColor = (characterId: number): string => {
  const level = getCharacterLevel(characterId)
  return level === 's' ? '#facd7e' : '#a78fc5'
}

const getCharacterName = (characterId: number): string => {
  return gameDataStore.getCharacterNameById(characterId) || 'Unknown'
}
</script>

<template>
  <g class="grid-characters-container">
    <!-- SVG elements for visual display -->
    <g v-for="[hexId, characterId] in characterPlacements" :key="hexId" class="grid-characters">
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
          :fill="getBackgroundColor(characterId)"
          :fill-opacity="backgroundOpacity"
          :stroke="getBackgroundColor(characterId)"
          :stroke-width="borderWidth"
        />
        <!-- Character image (clipped to inner circle) -->
        <image
          :href="characterImages[getCharacterName(characterId)]"
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
