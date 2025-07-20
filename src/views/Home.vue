<script setup lang="ts">
import { ref } from 'vue'
import CharacterSelection from '../components/CharacterSelection.vue'
import HexGrid from '../components/grid/HexGrid.vue'
import CharacterPlacement from '../components/grid/CharacterPlacement.vue'
import HexArrow from '../components/grid/HexArrow.vue'
import type { CharacterType } from '../types/character'
import type { Hex } from '../lib/Hex'
import { Grid } from '../lib/Grid'
import { Layout, POINTY } from '../lib/Layout'

const grid = new Grid()
const gridOrigin = { x: 300, y: 300 }
const layout = new Layout(POINTY, { x: 40, y: 40 }, gridOrigin)
const hexes = grid.keys()

// Character placement on hexes
const characterPlacements = ref(new Map<number, string>())

// Function to place character on hex
const placeCharacterOnHex = (hexId: number, imageSrc: string) => {
  characterPlacements.value.set(hexId, imageSrc)
}

// Function to remove character from hex
const removeCharacterFromHex = (hexId: number) => {
  characterPlacements.value.delete(hexId)
}

// Event handlers
const handleHexClick = (hex: Hex) => {
  console.log('Hex clicked:', hex.getId())
}

const handleCharacterClick = (hexId: number, imageSrc: string) => {
  console.log('Character clicked:', hexId, imageSrc)
}

const handleArrowClick = (startHexId: number, endHexId: number) => {
  console.log('Arrow clicked:', startHexId, '->', endHexId)
}

// Example: Place a character on hex 15
placeCharacterOnHex(15, '/src/assets/images/character/athalia.png')

const characters = (
  Object.values(
    import.meta.glob('../data/character/*.json', { eager: true, import: 'default' }),
  ) as CharacterType[]
).sort((a, b) => a.faction.localeCompare(b.faction))

const characterImages = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/images/character/*.png', { eager: true, import: 'default' }),
  ).map(([path, src]) => [(path.split('/').pop() ?? '').replace('.png', ''), src as string]),
)

const icons = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/images/icons/*.png', { eager: true, import: 'default' }),
  ).map(([path, src]) => [(path.split('/').pop() ?? '').replace('.png', ''), src as string]),
)
</script>

<template>
  <main>
    <div class="content">
      <div class="section">
        <div id="map">
          <HexGrid
            :hexes="hexes"
            :layout="layout"
            :width="600"
            :height="600"
            :rotation="0"
            :center-x="gridOrigin.x"
            :center-y="gridOrigin.y"
            :text-rotation="30"
            @hex-click="handleHexClick"
          >
            <!-- Character placements -->
            <CharacterPlacement
              :character-placements="characterPlacements"
              :hexes="hexes"
              :layout="layout"
              @character-click="handleCharacterClick"
            />

            <!-- Arrow from hex 1 to hex 27 -->
            <HexArrow
              :start-hex-id="1"
              :end-hex-id="27"
              :hexes="hexes"
              :layout="layout"
              @arrow-click="handleArrowClick"
            />
          </HexGrid>
        </div>
      </div>

      <div class="section">
        <CharacterSelection
          :characters="characters"
          :characterImages="characterImages"
          :icons="icons"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.content {
  max-width: 1280px;
  width: 100%;
  padding: 0 2em;
  text-align: center;
}

.section {
  padding: 2em;
  margin: 0 0 2rem;
  color: #484848;
  background-color: #f8f5ec;
  border-radius: 8px;
}

#map {
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
