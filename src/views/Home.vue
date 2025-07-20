<script setup lang="ts">
import CharacterSelection from '../components/CharacterSelection.vue'
import HexGrid from '../components/grid/HexGrid.vue'
import CharacterPlacement from '../components/grid/CharacterPlacement.vue'
import HexArrow from '../components/grid/HexArrow.vue'
import GridStats from '../components/GridStats.vue'
import type { CharacterType } from '../types/character'
import type { Hex } from '../lib/Hex'
import { useGridStore } from '../stores/grid'
import { ref } from 'vue'

// Use Pinia grid store
const gridStore = useGridStore()

// Grid stats visibility toggle
const debugGrid = ref(true)

const toggleGridStats = () => {
  debugGrid.value = !debugGrid.value
}

// Event handlers
const handleHexClick = (hex: Hex) => {
  console.log('Hex clicked:', hex.getId())
}

const handleCharacterClick = (hexId: number, characterId: string) => {
  console.log('Character clicked:', hexId, characterId)
}

const handleArrowClick = (startHexId: number, endHexId: number) => {
  console.log('Arrow clicked:', startHexId, '->', endHexId)
}

// Grid starts empty - no default character placement

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
            :hexes="gridStore.hexes"
            :layout="gridStore.layout"
            :width="600"
            :height="600"
            :rotation="0"
            :center-x="gridStore.gridOrigin.x"
            :center-y="gridStore.gridOrigin.y"
            :text-rotation="30"
            :show-coordinates="debugGrid"
            @hex-click="handleHexClick"
          >
            <!-- Character placements -->
            <CharacterPlacement
              :character-placements="gridStore.characterPlacements"
              :hexes="gridStore.hexes"
              :layout="gridStore.layout"
              :character-images="characterImages"
              @character-click="handleCharacterClick"
            />

            <!-- No default arrows - add them as needed -->
          </HexGrid>
        </div>
      </div>

      <!-- Grid Stats Toggle Button -->
      <div class="stats-toggle-container">
        <button @click="toggleGridStats" class="stats-toggle-btn">
          <span class="toggle-icon">{{ debugGrid ? '▼' : '▶' }}</span>
          {{ debugGrid ? 'Hide' : 'Show' }} Debug
        </button>
      </div>

      <!-- Grid Stats Section -->
      <div v-show="debugGrid" class="section">
        <GridStats />
      </div>

      <div class="section">
        <CharacterSelection
          :characters="characters"
          :characterImages="characterImages"
          :icons="icons"
          :isDraggable="true"
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

.stats-toggle-container {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.stats-toggle-btn {
  background: #36958e;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition:
    background-color 0.2s ease,
    transform 0.1s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stats-toggle-btn:hover {
  background: #005a9e;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.stats-toggle-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.toggle-icon {
  font-size: 0.9rem;
  transition: transform 0.2s ease;
}
</style>
