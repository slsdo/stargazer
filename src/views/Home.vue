<script setup lang="ts">
import CharacterSelection from '../components/CharacterSelection.vue'
import ArtifactSelection from '../components/ArtifactSelection.vue'
import GridManager from '../components/GridManager.vue'
import TabNavigation from '../components/TabNavigation.vue'
import GridControls from '../components/GridControls.vue'
import DragDropProvider from '../components/DragDropProvider.vue'
import { Team } from '../lib/types/team'
import { useGridStore } from '../stores/grid'
import { getMapNames } from '../lib/maps'
import { ref } from 'vue'

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

// Initialize data immediately (synchronous)
gridStore.initializeData()

// Event handlers
const handleArtifactGridClick = (team: Team) => {
  gridStore.removeArtifact(team)
}

// Placeholder handlers for action buttons
const handleCopyLink = () => {
  // TODO: Implement copy link functionality
  console.log('Copy Link clicked - implementation coming soon')
}

const handleCopyImage = () => {
  // TODO: Implement copy image functionality
  console.log('Copy Image clicked - implementation coming soon')
}

const handleDownload = () => {
  // TODO: Implement download functionality
  console.log('Download clicked - implementation coming soon')
}
</script>

<template>
  <main>
    <DragDropProvider>
      <div class="content">
        <div class="section">
          <!-- Grid Manager Component -->
          <GridManager
            :characters="gridStore.characters"
            :character-images="gridStore.characterImages"
            :artifact-images="gridStore.artifactImages"
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
            @copyLink="handleCopyLink"
            @copyImage="handleCopyImage"
            @download="handleDownload"
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
              :characters="gridStore.characters"
              :characterImages="gridStore.characterImages"
              :icons="gridStore.icons"
              :isDraggable="true"
            />
          </div>
          <!-- Artifacts Tab -->
          <div v-show="activeTab === 'artifacts'" class="tab-panel">
            <ArtifactSelection
              :artifacts="gridStore.artifacts"
              :artifactImages="gridStore.artifactImages"
              :icons="gridStore.icons"
            />
          </div>
          <!-- Map Editor Tab -->
          <div v-show="activeTab === 'mapEditor'" class="tab-panel">
            <div class="map-editor-placeholder">
              <h3>Map Editor</h3>
              <p>Map editor functionality coming soon...</p>
            </div>
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

.map-editor-placeholder {
  text-align: center;
  padding: var(--spacing-4xl);
}

.map-editor-placeholder h3 {
  color: var(--color-primary);
  margin-bottom: var(--spacing-lg);
}

.map-editor-placeholder p {
  color: var(--color-text-secondary);
  font-style: italic;
}
</style>
