<script setup lang="ts">
import CharacterSelection from '../components/CharacterSelection.vue'
import GridTiles from '../components/GridTiles.vue'
import GridCharacters from '../components/GridCharacters.vue'
import GridArrow from '../components/GridArrow.vue'
import DebugGrid from '../components/DebugGrid.vue'
import type { CharacterType } from '../types/character'
import type { Hex } from '../lib/hex'
import { useGridStore } from '../stores/grid'
import { getMapNames } from '../lib/maps'
import { ref, onMounted, onUnmounted } from 'vue'
import { loadAssetsDict } from '../utils/assetLoader'

// Use Pinia grid store
const gridStore = useGridStore()

// Tab state management
const activeTab = ref('characters')
const debugGrid = ref(true)

// Map management
const availableMaps = getMapNames()
const selectedMap = ref('arena1')
const showMapDropdown = ref(false)

const setActiveTab = (tab: string) => {
  activeTab.value = tab
  showMapDropdown.value = false // Close dropdown when switching tabs
}

const toggleMapDropdown = () => {
  showMapDropdown.value = !showMapDropdown.value
}

const handleMapChange = (mapKey: string) => {
  console.log('Switching to map:', mapKey)
  const success = gridStore.switchMap(mapKey)
  if (success) {
    selectedMap.value = mapKey
  }
  showMapDropdown.value = false // Close dropdown after selection
}

// Close dropdown when clicking outside
const handleClickOutside = (event: MouseEvent) => {
  const dropdown = document.querySelector('.tab-dropdown')
  if (dropdown && !dropdown.contains(event.target as Node)) {
    showMapDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Event handlers
const handleHexClick = (hex: Hex) => {
  gridStore.handleHexClick(hex)
}

const handleCharacterClick = (hexId: number, characterId: string) => {
  console.log('Character clicked on grid:', hexId, characterId, '- removing from grid')
  gridStore.removeCharacterFromHex(hexId)
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

const characterImages = loadAssetsDict(
  import.meta.glob('../assets/images/character/*.png', {
    eager: true,
    import: 'default',
  }) as Record<string, string>,
)

const icons = loadAssetsDict(
  import.meta.glob('../assets/images/icons/*.png', { eager: true, import: 'default' }) as Record<
    string,
    string
  >,
)
</script>

<template>
  <main>
    <div class="content">
      <div class="section">
        <div id="map">
          <svg width="600" height="600" style="position: absolute; pointer-events: none">
            <!-- Arrows from ally characters to closest enemies (rendered on top of everything) -->
            <g class="arrows-layer" style="pointer-events: auto">
              <!-- Ally to Enemy arrows (teal) -->
              <GridArrow
                v-for="[allyHexId, enemyInfo] in gridStore.closestEnemyMap"
                :key="`arrow-ally-${allyHexId}-${enemyInfo.enemyHexId}`"
                :start-hex-id="allyHexId"
                :end-hex-id="enemyInfo.enemyHexId"
                :color="'#36958e'"
                :stroke-width="3"
                :arrowhead-size="6"
                @arrow-click="handleArrowClick"
              />
              <!-- Enemy to Ally arrows (red) -->
              <GridArrow
                v-for="[enemyHexId, allyInfo] in gridStore.closestAllyMap"
                :key="`arrow-enemy-${enemyHexId}-${allyInfo.allyHexId}`"
                :start-hex-id="enemyHexId"
                :end-hex-id="allyInfo.allyHexId"
                :color="'#dc3545'"
                :stroke-width="3"
                :arrowhead-size="6"
                @arrow-click="handleArrowClick"
              />
            </g>
          </svg>
          <GridTiles
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
            <GridCharacters
              :character-placements="gridStore.characterPlacements"
              :hexes="gridStore.hexes"
              :layout="gridStore.layout"
              :character-images="characterImages"
              :characters="characters"
              @character-click="handleCharacterClick"
            />
          </GridTiles>
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
          <div class="tab-dropdown">
            <button @click="toggleMapDropdown" class="tab-btn dropdown-btn">
              Map: {{ availableMaps.find((m) => m.key === selectedMap)?.name || 'Arena 1' }} ▼
            </button>
            <div v-if="showMapDropdown" class="dropdown-content">
              <button
                v-for="map in availableMaps"
                :key="map.key"
                @click="handleMapChange(map.key)"
                :class="['dropdown-item', { selected: selectedMap === map.key }]"
              >
                {{ map.name }}
              </button>
            </div>
          </div>
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
  position: relative;
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
  overflow: visible;
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

.tab-dropdown {
  position: relative;
  display: inline-block;
  overflow: visible;
}

.dropdown-btn {
  border-right: 1px solid #d4cfc0;
}

.dropdown-content {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #f8f5ec;
  border: 2px solid #d4cfc0;
  border-top: none;
  border-radius: 0 0 6px 6px;
  z-index: 9999;
  max-height: 400px;
  overflow-y: auto;
  min-width: 120px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.dropdown-item {
  width: 100%;
  background: transparent;
  color: #666;
  border: none;
  padding: 0.75rem 1rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
  text-align: center;
  border-bottom: 1px solid #e8e4d9;
}

.dropdown-item:last-child {
  border-bottom: none;
}

.dropdown-item:hover {
  background: #f0ebe0;
  color: #36958e;
}

.dropdown-item.selected {
  background: #36958e;
  color: white;
}
</style>
