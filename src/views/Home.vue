<script setup lang="ts">
import CharacterSelection from '../components/CharacterSelection.vue'
import HexGrid from '../components/grid/HexGrid.vue'
import CharacterPlacement from '../components/grid/CharacterPlacement.vue'
import DebugGrid from '../components/DebugGrid.vue'
import type { CharacterType } from '../types/character'
import type { Hex } from '../lib/hex'
import { useGridStore } from '../stores/grid'
import { ref } from 'vue'

// Use Pinia grid store
const gridStore = useGridStore()

// Tab state management
const activeTab = ref('characters')
const debugGrid = ref(true)

const setActiveTab = (tab: string) => {
  activeTab.value = tab
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
            :show-coordinates="activeTab === 'debug'"
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

      <!-- Tab Navigation -->
      <div class="tab-container">
        <div class="tab-buttons">
          <button
            @click="setActiveTab('characters')"
            :class="['tab-btn', { active: activeTab === 'characters' }]"
          >
            Characters
          </button>
          <button
            @click="setActiveTab('debug')"
            :class="['tab-btn', { active: activeTab === 'debug' }]"
          >
            Debug
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Characters Tab -->
          <div v-show="activeTab === 'characters'" class="tab-panel">
            <CharacterSelection
              :characters="characters"
              :characterImages="characterImages"
              :icons="icons"
              :isDraggable="true"
            />
          </div>

          <!-- Debug Tab -->
          <div v-show="activeTab === 'debug'" class="tab-panel">
            <DebugGrid />
          </div>
        </div>
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

.tab-container {
  margin: 2rem 0;
}

.tab-buttons {
  display: flex;
  justify-content: flex-start;
  background: #e8e4d9;
  border-radius: 8px 8px 0 0;
  padding: 0;
  overflow: hidden;
  border: 2px solid #d4cfc0;
  border-bottom: none;
}

.tab-btn {
  background: transparent;
  color: #666;
  border: none;
  padding: 1rem 2rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
  border-right: 1px solid #d4cfc0;
  position: relative;
}

.tab-btn:last-child {
  border-right: none;
}

.tab-btn:hover {
  background: #f0ebe0;
  color: #36958e;
}

.tab-btn.active {
  background: #f8f5ec;
  color: #36958e;
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #36958e;
}

.tab-content {
  background: #f8f5ec;
  border: 2px solid #d4cfc0;
  border-radius: 0 0 8px 8px;
  border-top: none;
}

.tab-panel {
  padding: 2rem;
  color: #484848;
}
</style>
