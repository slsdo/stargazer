<script setup lang="ts">
import { useGridStore } from '../stores/grid'

// Access Pinia grid store
const gridStore = useGridStore()

// Helper function to extract image name from path
const getImageName = (imageSrc: string): string => {
  return imageSrc.split('/').pop()?.replace('.png', '') || 'Unknown'
}
</script>

<template>
  <div class="grid-stats">
    <h3>Grid Statistics</h3>
    <p>Total Hexes: {{ gridStore.totalHexes }}</p>
    <p>Characters Placed: {{ gridStore.charactersPlaced }}</p>
    <p>Grid Origin: ({{ gridStore.gridOrigin.x }}, {{ gridStore.gridOrigin.y }})</p>
    <p>Hex Size: {{ gridStore.layout.size.x }}×{{ gridStore.layout.size.y }}</p>

    <div v-if="gridStore.charactersPlaced > 0">
      <h4>Placed Characters:</h4>
      <ul>
        <li v-for="[hexId, imageSrc] in gridStore.placedCharactersList" :key="hexId">
          Hex {{ hexId }}: {{ getImageName(imageSrc) }}
          <button @click="gridStore.removeCharacterFromHex(hexId)" class="remove-btn">
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
  margin: 1rem 0;
}

.grid-stats h3 {
  margin-top: 0;
  color: #333;
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
  background: #ff9800;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 1rem;
  width: 100%;
}

.clear-all-btn:hover {
  background: #f57c00;
}
</style>
