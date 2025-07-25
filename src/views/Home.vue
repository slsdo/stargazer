/**
 * Home.vue - Main application layout
 */
<script setup lang="ts">
import CharacterSelection from '../components/CharacterSelection.vue'
import ArtifactSelection from '../components/ArtifactSelection.vue'
import GridManager from '../components/GridManager.vue'
import TabNavigation from '../components/TabNavigation.vue'
import GridControls from '../components/GridControls.vue'
import DragDropProvider from '../components/DragDropProvider.vue'
import MapEditor from '../components/MapEditor.vue'
import { Team } from '../lib/types/team'
import { useGridStore } from '../stores/grid'
import { getMapNames } from '../lib/maps'
import { generateShareableUrl } from '../utils/urlStateManager'
import { ref } from 'vue'
import { State } from '../lib/types/state'

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

// Map editor state
const selectedMapEditorState = ref<State>(State.DEFAULT)

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

// Action button handlers

const handleCopyLink = async () => {
  try {
    // Generate shareable URL with current grid state exactly as it appears
    const shareableUrl = generateShareableUrl(
      gridStore.getAllTiles(),
      gridStore.allyArtifact,
      gridStore.enemyArtifact,
    )

    // Copy URL to clipboard
    await navigator.clipboard.writeText(shareableUrl)
    console.log('Grid link copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy grid link:', error)
  }
}

const handleCopyImage = async () => {
  try {
    // Import html-to-image dynamically
    const { toPng } = await import('html-to-image')

    // Get the map element
    const mapElement = document.getElementById('map')
    if (!mapElement) {
      console.error('Map element not found')
      return
    }

    // Generate PNG from the map element
    const dataUrl = await toPng(mapElement, {
      quality: 1.0,
      pixelRatio: 2, // Higher quality export
      backgroundColor: 'transparent', // Transparent background
    })

    // Convert data URL to blob
    const response = await fetch(dataUrl)
    const blob = await response.blob()

    // Copy to clipboard using Clipboard API
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ])
      console.log('Grid image copied to clipboard!')
    } else {
      // Fallback: show message for manual copy
      console.warn('Clipboard API not supported. Image generated but not copied.')
      // Could show a modal with the image for manual copying
    }
  } catch (error) {
    console.error('Failed to copy grid image:', error)
  }
}

const handleDownload = async () => {
  try {
    // Import html-to-image dynamically
    const { toPng } = await import('html-to-image')

    // Get the map element
    const mapElement = document.getElementById('map')
    if (!mapElement) {
      console.error('Map element not found')
      return
    }

    // Generate PNG from the map element
    const dataUrl = await toPng(mapElement, {
      quality: 1.0,
      pixelRatio: 2, // Higher quality export
      backgroundColor: 'transparent', // Transparent background
    })

    // Create download link
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
    const timeStr =
      now.toTimeString().split(' ')[0].replace(/:/g, '') +
      now.getMilliseconds().toString().padStart(3, '0')
    const link = document.createElement('a')
    link.download = `stargazer-${dateStr}-${timeStr}.png`
    link.href = dataUrl

    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    console.log('Grid exported successfully!')
  } catch (error) {
    console.error('Failed to export grid:', error)
  }
}

const handleMapEditorStateSelected = (state: State) => {
  selectedMapEditorState.value = state
}

const handleClearMap = () => {
  gridStore.resetToCurrentMap()
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
            :is-map-editor-mode="activeTab === 'mapEditor'"
            :selected-map-editor-state="selectedMapEditorState"
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
            <MapEditor @state-selected="handleMapEditorStateSelected" @clear-map="handleClearMap" />
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
