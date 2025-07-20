<script setup lang="ts">
import { ref } from 'vue'
import { useGridStore } from '../stores/grid'

// Access Pinia grid store
const gridStore = useGridStore()

// Collapse/expand state
const isCollapsed = ref(false)

// Toggle function
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value
}

// Helper function to extract image name from path
const getImageName = (imageSrc: string): string => {
  return imageSrc.split('/').pop()?.replace('.png', '') || 'Unknown'
}
</script>

<template>
  <div class="grid-stats" :class="{ 'collapsed': isCollapsed }">
    <div class="stats-header">
      <h3>Grid Statistics</h3>
      <button @click="toggleCollapse" class="toggle-btn" :class="{ 'collapsed': isCollapsed }">
        <span class="toggle-icon">{{ isCollapsed ? '▶' : '▼' }}</span>
        {{ isCollapsed ? 'Show' : 'Hide' }}
      </button>
    </div>
    
    <div v-show="!isCollapsed" class="stats-content">
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
  </div>
</template>

<style scoped>
.grid-stats {
  padding: 1rem;
  background: #f0f0f0;
  border-radius: 8px;
  margin: 1rem 0;
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
