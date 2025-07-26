<script setup lang="ts">
import { ref } from 'vue'
import { useGridStore } from '../stores/grid'
import { useCharacterStore } from '../stores/character'
import { usePathfindingStore } from '../stores/pathfinding'
import { useArtifactStore } from '../stores/artifact'
import { getStateName, getStateClass } from '../utils/stateFormatting'
import { extractFileName } from '../utils/dataLoader'
import { Team } from '../lib/types/team'

// Access Pinia stores
const gridStore = useGridStore()
const characterStore = useCharacterStore()
const pathfindingStore = usePathfindingStore()
const artifactStore = useArtifactStore()

// Character visibility toggles for debug lines
const hiddenCharacters = ref<Set<number>>(new Set())

// Helper function to extract image name from path
const getImageName = (imageSrc: string): string => {
  return extractFileName(imageSrc)
}

// Toggle visibility of debug lines for a character
const toggleCharacterDebugLines = (hexId: number) => {
  if (hiddenCharacters.value.has(hexId)) {
    hiddenCharacters.value.delete(hexId)
  } else {
    hiddenCharacters.value.add(hexId)
  }
  // Trigger reactivity
  hiddenCharacters.value = new Set(hiddenCharacters.value)
}

// Check if debug lines should be shown for a character
const shouldShowDebugLines = (hexId: number): boolean => {
  return !hiddenCharacters.value.has(hexId)
}

// Show/hide all debug lines
const toggleAllDebugLines = (show: boolean) => {
  if (show) {
    hiddenCharacters.value.clear()
  } else {
    const allHexIds = characterStore.getTilesWithCharacters().map(tile => tile.hex.getId())
    hiddenCharacters.value = new Set(allHexIds)
  }
}

// Expose functions for PathfindingDebug component
defineExpose({
  shouldShowDebugLines
})
</script>

<template>
  <div class="grid-stats">
    <h3>Debug Grid</h3>
    <p>
      Total Hexes: {{ gridStore.hexes.length }}; Characters Placed:
      {{ characterStore.charactersPlaced }}; Grid Origin: ({{ gridStore.gridOrigin.x }},
      {{ gridStore.gridOrigin.y }}); Hex Size: {{ gridStore.layout.size.x }}×{{
        gridStore.layout.size.y
      }}
    </p>

    <div v-if="characterStore.charactersPlaced > 0">
      <ul>
        <li
          v-for="tile in characterStore.getTilesWithCharacters()"
          :key="tile.hex.getId()"
          class="character-tile"
          :class="{
            'ally-character': tile.team === Team.ALLY,
            'enemy-character': tile.team === Team.ENEMY,
          }"
        >
          <div class="tile-info">
            <div class="tile-main">
              <span class="hex-id">Hex {{ tile.hex.getId() }}</span>
              <span class="character-name">{{ getImageName(tile.character!) }}</span>
            </div>
            <div class="tile-state">
              <span class="state-label" :class="getStateClass(tile.state)">
                {{ getStateName(tile.state) }}
              </span>
              <!-- Show closest enemy info for Ally characters -->
              <div
                v-if="
                  tile.team === Team.ALLY && pathfindingStore.closestEnemyMap.has(tile.hex.getId())
                "
                class="closest-info"
              >
                <span class="closest-enemy">
                  → Enemy at Hex
                  {{ pathfindingStore.closestEnemyMap.get(tile.hex.getId())?.enemyHexId }} (distance:
                  {{ pathfindingStore.closestEnemyMap.get(tile.hex.getId())?.distance }})
                </span>
                <label class="debug-toggle-inline">
                  <input
                    type="checkbox"
                    :checked="shouldShowDebugLines(tile.hex.getId())"
                    @change="toggleCharacterDebugLines(tile.hex.getId())"
                    class="debug-checkbox"
                  />
                  <span class="debug-label">lines</span>
                </label>
              </div>
              <!-- Show closest ally info for Enemy characters -->
              <div
                v-if="
                  tile.team === Team.ENEMY && pathfindingStore.closestAllyMap.has(tile.hex.getId())
                "
                class="closest-info"
              >
                <span class="closest-ally">
                  → Ally at Hex
                  {{ pathfindingStore.closestAllyMap.get(tile.hex.getId())?.allyHexId }} (distance:
                  {{ pathfindingStore.closestAllyMap.get(tile.hex.getId())?.distance }})
                </span>
                <label class="debug-toggle-inline">
                  <input
                    type="checkbox"
                    :checked="shouldShowDebugLines(tile.hex.getId())"
                    @change="toggleCharacterDebugLines(tile.hex.getId())"
                    class="debug-checkbox"
                  />
                  <span class="debug-label">lines</span>
                </label>
              </div>
            </div>
          </div>
          <button
            @click="characterStore.removeCharacterFromHex(tile.hex.getId())"
            class="remove-btn"
          >
            ×
          </button>
        </li>
      </ul>
      
      <!-- Debug Lines Controls -->
      <div class="debug-controls" v-if="characterStore.charactersPlaced > 0">
        <h4>Debug Lines</h4>
        <div class="debug-actions">
          <button @click="toggleAllDebugLines(true)" class="debug-action-btn">
            Show All
          </button>
          <button @click="toggleAllDebugLines(false)" class="debug-action-btn">
            Hide All
          </button>
        </div>
      </div>
    </div>

    <!-- Artifact Selection Info -->
    <div class="artifact-section">
      <h4>Artifact Selection</h4>
      <div class="artifact-info">
        <div class="artifact-team ally">
          <span class="team-label">Artifact (Ally):</span>
          <span class="artifact-name" v-if="artifactStore.allyArtifact">
            {{ artifactStore.allyArtifact }}
          </span>
          <span class="artifact-name" v-else>n/a</span>
          <button
            v-if="artifactStore.allyArtifact"
            @click="artifactStore.removeArtifact(Team.ALLY)"
            class="remove-artifact-btn"
          >
            ×
          </button>
        </div>
        <div class="artifact-team enemy">
          <span class="team-label">Artifact (Enemy):</span>
          <span class="artifact-name" v-if="artifactStore.enemyArtifact">
            {{ artifactStore.enemyArtifact }}
          </span>
          <span class="artifact-name" v-else>n/a</span>
          <button
            v-if="artifactStore.enemyArtifact"
            @click="artifactStore.removeArtifact(Team.ENEMY)"
            class="remove-artifact-btn"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid-stats {
  padding: var(--spacing-lg);
  background: var(--color-bg-light-gray);
  border-radius: var(--radius-large);
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.grid-stats h3 {
  margin: 0;
  color: var(--color-text-primary);
}

.toggle-btn {
  background: #007acc;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s ease;
}

.toggle-btn:hover {
  background: #005a9e;
}

.toggle-btn.collapsed {
  background: #6c757d;
}

.toggle-btn.collapsed:hover {
  background: #5a6268;
}

.toggle-icon {
  font-size: 0.8rem;
  transition: transform 0.2s ease;
}

.stats-content {
  animation: fadeIn 0.3s ease-in-out;
}

.stats-header + .stats-content {
  margin-top: 0;
}

.grid-stats.collapsed .stats-header {
  margin-bottom: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.grid-stats p {
  margin: var(--spacing-sm) 0;
  color: var(--color-text-secondary);
}

.grid-stats ul {
  list-style: none;
  padding: 0;
}

.grid-stats li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-sm);
  background: var(--color-bg-white);
  margin: var(--spacing-sm) 0;
  border-radius: var(--radius-small);
}

.character-tile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg-white);
  margin: var(--spacing-sm) 0;
  border-radius: var(--radius-medium);
  border-left: 4px solid var(--color-border-light);
}

.closest-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.character-tile.ally-character {
  border-left-color: var(--color-ally);
}

.character-tile.enemy-character {
  border-left-color: var(--color-enemy);
}

.tile-info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  flex: 1;
}

.tile-main {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

.hex-id {
  font-weight: bold;
  color: var(--color-text-primary);
  font-size: 0.9rem;
}

.character-name {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
}

.tile-state {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.state-label {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* State-specific colors */
.state-default {
  background: #e9ecef;
  color: #495057;
}

.state-available-ally {
  background: #d4edda;
  color: #155724;
}

.state-available-enemy {
  background: #fff3cd;
  color: #856404;
}

.state-occupied-ally {
  background: #cce7ff;
  color: #004085;
}

.state-occupied-enemy {
  background: #f8d7da;
  color: #721c24;
}

.state-blocked {
  background: #d1ecf1;
  color: #0c5460;
}

.state-blocked-breakable {
  background: #e2e3e5;
  color: #383d41;
}

.state-unknown {
  background: #f8f9fa;
  color: #6c757d;
}

.closest-enemy {
  font-size: 0.75rem;
  color: #c82333;
  font-style: italic;
}

.closest-ally {
  font-size: 0.75rem;
  color: #36958e;
  font-style: italic;
}

.remove-btn {
  background: var(--color-danger);
  color: white;
  border: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-small);
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
  line-height: 1;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: var(--color-danger-hover);
}

/* Artifact section styles */
.artifact-section {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 2px solid #ddd;
}

.artifact-section h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1rem;
}

.artifact-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.artifact-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #ddd;
}

.artifact-team.ally {
  border-left-color: #36958e;
}

.artifact-team.enemy {
  border-left-color: #c82333;
}

.team-label {
  font-weight: bold;
  font-size: 0.9rem;
  color: #333;
  min-width: 130px;
  text-align: left;
}

.artifact-name {
  color: #666;
  font-size: 0.9rem;
  flex: 1;
  font-family: monospace;
  text-align: left;
}

.remove-artifact-btn {
  background: #c05b4d;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: bold;
  line-height: 1;
  min-width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-artifact-btn:hover {
  background: #c82333;
}

/* Debug lines controls */
.debug-controls {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 2px solid #ddd;
}

.debug-controls h4 {
  margin: 0 0 0.75rem 0;
  color: #333;
  font-size: 1rem;
}

.debug-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.debug-action-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-small);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
}

.debug-action-btn:hover {
  background: var(--color-primary-hover);
}

.debug-toggle-inline {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  user-select: none;
}

.debug-checkbox {
  width: 12px;
  height: 12px;
  cursor: pointer;
  accent-color: var(--color-primary);
  margin: 0;
}

.debug-label {
  font-style: italic;
  color: var(--color-text-secondary);
}
</style>
