<script setup lang="ts">
import { useGridStore } from '../stores/grid'
import { getStateName, getStateClass } from '../utils/stateFormatting'
import { extractFileName } from '../utils/assetLoader'

// Access Pinia grid store
const gridStore = useGridStore()

// Removed internal collapse state - now handled by parent component

// Helper function to extract image name from path
const getImageName = (imageSrc: string): string => {
  return extractFileName(imageSrc)
}
</script>

<template>
  <div class="grid-stats">
    <h3>Debug Grid</h3>
    <p>
      Total Hexes: {{ gridStore.totalHexes }}; Characters Placed: {{ gridStore.charactersPlaced }};
      Grid Origin: ({{ gridStore.gridOrigin.x }}, {{ gridStore.gridOrigin.y }}); Hex Size:
      {{ gridStore.layout.size.x }}×{{ gridStore.layout.size.y }}
    </p>

    <div v-if="gridStore.charactersPlaced > 0">
      <ul>
        <li
          v-for="tile in gridStore.getTilesWithCharacters()"
          :key="tile.hex.getId()"
          class="character-tile"
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
            </div>
          </div>
          <button @click="gridStore.removeCharacterFromHex(tile.hex.getId())" class="remove-btn">
            Remove
          </button>
        </li>
      </ul>
      <button @click="gridStore.clearAllCharacters()" class="clear-all-btn">Clear All</button>
    </div>
  </div>
</template>

<style scoped>
.grid-stats {
  padding: 1rem;
  background: #f0f0f0;
  border-radius: 8px;
}

.stats-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.grid-stats h3 {
  margin: 0;
  color: #333;
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
  margin: 0.5rem 0;
  color: #666;
}

.grid-stats ul {
  list-style: none;
  padding: 0;
}

.grid-stats li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: white;
  margin: 0.5rem 0;
  border-radius: 4px;
}

.character-tile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  margin: 0.5rem 0;
  border-radius: 6px;
  border-left: 4px solid #ddd;
}

.tile-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.tile-main {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.hex-id {
  font-weight: bold;
  color: #333;
  font-size: 0.9rem;
}

.character-name {
  color: #666;
  font-size: 0.9rem;
}

.tile-state {
  display: flex;
  align-items: center;
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

.state-available-self {
  background: #d4edda;
  color: #155724;
}

.state-available-enemy {
  background: #fff3cd;
  color: #856404;
}

.state-occupied-self {
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

.remove-btn {
  background: #ff6b6b;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8rem;
}

.remove-btn:hover {
  background: #ff5252;
}

.clear-all-btn {
  background: #555;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  width: 100%;
}

.clear-all-btn:hover {
  background: #333;
}
</style>
