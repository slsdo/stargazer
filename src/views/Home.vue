<script setup lang="ts">
import CharacterSelection from '../components/CharacterSelection.vue'
import ArtifactSelection from '../components/ArtifactSelection.vue'
import GridTiles from '../components/GridTiles.vue'
import GridCharacters from '../components/GridCharacters.vue'
import GridArrow from '../components/GridArrow.vue'
import DebugGrid from '../components/DebugGrid.vue'
import TabNavigation from '../components/TabNavigation.vue'
import GridControls from '../components/GridControls.vue'
import GridArtifacts from '../components/GridArtifacts.vue'
import type { CharacterType } from '../lib/types/character'
import type { ArtifactType } from '../lib/types/artifact'
import type { Hex } from '../lib/hex'
import { Team } from '../lib/types/team'
import { useGridStore } from '../stores/grid'
import { getMapNames } from '../lib/maps'
import { ref, onMounted, onUnmounted } from 'vue'
import { loadAssetsDict } from '../utils/assetLoader'

// Use Pinia grid store
const gridStore = useGridStore()

// Tab state management
const activeTab = ref('characters')
const showDebug = ref(false)

// Map management
const availableMaps = getMapNames()
const selectedMap = ref('arena1')

// Grid display toggles
const showArrows = ref(true)
const showHexIds = ref(true)

const handleTabChange = (tab: string) => {
  activeTab.value = tab
}

const handleMapChange = (mapKey: string) => {
  console.log('Switching to map:', mapKey)
  const success = gridStore.switchMap(mapKey)
  if (success) {
    selectedMap.value = mapKey
  }
}

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

const handleArtifactGridClick = (team: Team) => {
  console.log('Artifact grid clicked for team:', team)
  gridStore.removeArtifact(team)
}

// Grid starts empty - no default character placement

const characters = (
  Object.values(
    import.meta.glob('../data/character/*.json', { eager: true, import: 'default' }),
  ) as CharacterType[]
).sort((a, b) => a.faction.localeCompare(b.faction))

const artifacts = (
  Object.values(
    import.meta.glob('../data/artifact/*.json', { eager: true, import: 'default' }),
  ) as ArtifactType[]
).sort((a, b) => a.id.localeCompare(b.id))

const characterImages = loadAssetsDict(
  import.meta.glob('../assets/images/character/*.png', {
    eager: true,
    import: 'default',
  }) as Record<string, string>,
)

const artifactImages = loadAssetsDict(
  import.meta.glob('../assets/images/artifact/*.png', {
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
        <div class="grid-container">
          <div id="map">
            <svg
              v-if="showArrows"
              width="600"
              height="600"
              style="position: absolute; pointer-events: none"
            >
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
                  :invert-curve="true"
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
              :show-hex-ids="showHexIds"
              :show-coordinates="showDebug"
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

            <!-- Artifact Display -->
            <GridArtifacts
              :allyArtifact="gridStore.allyArtifact"
              :enemyArtifact="gridStore.enemyArtifact"
              :artifactImages="artifactImages"
              @artifact-click="handleArtifactGridClick"
            />
          </div>

          <!-- Debug Panel -->
          <div v-if="showDebug" class="debug-panel">
            <DebugGrid />
          </div>
        </div>

        <!-- Grid Display Toggle -->
        <GridControls
          :showDebug="showDebug"
          :showArrows="showArrows"
          :showHexIds="showHexIds"
          @update:showDebug="showDebug = $event"
          @update:showArrows="showArrows = $event"
          @update:showHexIds="showHexIds = $event"
        />
      </div>

      <!-- Tab Navigation -->
      <TabNavigation
        :activeTab="activeTab"
        :availableMaps="availableMaps"
        :selectedMap="selectedMap"
        @tab-change="handleTabChange"
        @map-change="handleMapChange"
      >
        <!-- Tab Content -->
        <!-- Characters Tab -->
        <div v-show="activeTab === 'characters'" class="tab-panel">
          <CharacterSelection
            :characters="characters"
            :characterImages="characterImages"
            :icons="icons"
            :isDraggable="true"
          />
        </div>
        <!-- Artifacts Tab -->
        <div v-show="activeTab === 'artifacts'" class="tab-panel">
          <ArtifactSelection
            :artifacts="artifacts"
            :artifactImages="artifactImages"
            :icons="icons"
          />
        </div>
      </TabNavigation>
    </div>
  </main>
</template>

<style scoped>
main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: var(--spacing-2xl) 0;
}

.content {
  max-width: 1280px;
  width: 100%;
  padding: 0 2em;
  text-align: center;
}

.section {
  padding: 2em;
  margin: 0 0 var(--spacing-2xl);
  color: var(--color-text-muted);
  background-color: var(--color-bg-primary);
  border-radius: var(--radius-large);
}

.grid-container {
  display: flex;
  gap: var(--spacing-2xl);
  justify-content: center;
  align-items: flex-start;
}

#map {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.debug-panel {
  background: var(--color-bg-white);
  border: 2px solid var(--color-border-primary);
  border-radius: var(--radius-large);
  padding: var(--spacing-xl);
  max-width: 500px;
  max-height: 600px;
  overflow-y: auto;
}

/* Grid control styles moved to GridControls.vue component */

/* Tab navigation styles moved to TabNavigation.vue component */

.tab-panel {
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}

/* Artifact display styles moved to GridArtifacts.vue component */
</style>
