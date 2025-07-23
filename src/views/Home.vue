<script setup lang="ts">
import CharacterSelection from '../components/CharacterSelection.vue'
import ArtifactSelection from '../components/ArtifactSelection.vue'
import GridManager from '../components/GridManager.vue'
import TabNavigation from '../components/TabNavigation.vue'
import GridControls from '../components/GridControls.vue'
import DragDropProvider from '../components/DragDropProvider.vue'
import type { CharacterType } from '../lib/types/character'
import type { ArtifactType } from '../lib/types/artifact'
import { Team } from '../lib/types/team'
import { useGridStore } from '../stores/grid'
import { getMapNames } from '../lib/maps'
import { ref } from 'vue'
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
  const success = gridStore.switchMap(mapKey)
  if (success) {
    selectedMap.value = mapKey
  }
}

// Event handlers
const handleArtifactGridClick = (team: Team) => {
  gridStore.removeArtifact(team)
}

// Grid starts empty - no default character placement

const characters = (
  Object.values(
    import.meta.glob('../data/character/*.json', { eager: true, import: 'default' }),
  ) as CharacterType[]
).sort((a, b) => a.faction.localeCompare(b.faction))

// Create character ranges map and pass to store
const characterRanges = new Map<string, number>()
characters.forEach((char) => {
  characterRanges.set(char.id, char.range)
})
gridStore.setCharacterRanges(characterRanges)

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
    <DragDropProvider>
      <div class="content">
        <div class="section">
          <!-- Grid Manager Component -->
          <GridManager
            :characters="characters"
            :character-images="characterImages"
            :artifact-images="artifactImages"
            :show-arrows="showArrows"
            :show-hex-ids="showHexIds"
            :show-debug="showDebug"
            @artifact-click="handleArtifactGridClick"
          />

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
    </DragDropProvider>
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

.tab-panel {
  padding: var(--spacing-2xl);
  color: var(--color-text-muted);
}
</style>
