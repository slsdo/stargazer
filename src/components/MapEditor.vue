/**
 * MapEditor Component
 * 
 * Provides UI for editing hex tile states on the grid.
 * 
 * Features:
 * - State selection with visual previews
 * - Clear map button to reset all tiles to DEFAULT and remove all characters
 * - Painting over any tile removes characters and replaces state entirely
 * - Emits events for state selection and map clearing
 * 
 * Usage: Only active when 'mapEditor' tab is selected
 */
<script setup lang="ts">
import { ref } from 'vue'
import { State } from '../lib/types/state'
import { getHexFillColor } from '../utils/stateFormatting'

const selectedState = ref<State>(State.DEFAULT)

interface StateOption {
  state: State
  label: string
  description: string
}

const stateOptions: StateOption[] = [
  { state: State.DEFAULT, label: 'Default', description: 'Normal hex tile' },
  { state: State.AVAILABLE_ALLY, label: 'Ally Spawn', description: 'Ally placement zone' },
  { state: State.AVAILABLE_ENEMY, label: 'Enemy Spawn', description: 'Enemy placement zone' },
  { state: State.BLOCKED, label: 'Blocked', description: 'Permanent obstacle' },
  { state: State.BLOCKED_BREAKABLE, label: 'Breakable', description: 'Destructible obstacle' },
]

const emit = defineEmits<{
  stateSelected: [state: State]
  clearMap: []
}>()

const selectState = (state: State) => {
  selectedState.value = state
  emit('stateSelected', state)
}

const handleClearMap = () => {
  if (confirm('Are you sure you want to reset all tiles to default state and remove all characters? This cannot be undone.')) {
    emit('clearMap')
  }
}
</script>

<template>
  <div class="map-editor">
    <h3 class="editor-title">Map Editor</h3>
    <p class="editor-description">Select a state and click/drag on the grid to paint tiles</p>
    
    <div class="state-options">
      <button
        v-for="option in stateOptions"
        :key="option.state"
        class="state-button"
        :class="{ active: selectedState === option.state }"
        @click="selectState(option.state)"
      >
        <div class="state-preview">
          <svg width="30" height="30" viewBox="0 0 30 30">
            <polygon
              points="15,2 27,8 27,22 15,28 3,22 3,8"
              :fill="getHexFillColor(option.state)"
              stroke="#333"
              stroke-width="1"
            />
          </svg>
        </div>
        <div class="state-info">
          <div class="state-label">{{ option.label }}</div>
          <div class="state-description">{{ option.description }}</div>
        </div>
      </button>
    </div>
    
    <div class="map-editor-actions">
      <button class="clear-button" @click="handleClearMap">
        Clear Map
      </button>
    </div>
  </div>
</template>

<style scoped>
.map-editor {
  padding: 1rem;
}

.editor-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #e5e5e5;
}

.editor-description {
  color: #a3a3a3;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.state-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.state-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #1f2937;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.state-button:hover {
  background: #374151;
}

.state-button.active {
  border-color: #3b82f6;
  background: #1e3a5f;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

.state-preview {
  flex-shrink: 0;
}

.state-info {
  text-align: left;
}

.state-label {
  font-weight: 500;
  color: #e5e5e5;
  margin-bottom: 0.25rem;
}

.state-description {
  font-size: 0.75rem;
  color: #9ca3af;
}

.map-editor-actions {
  margin-top: 1.5rem;
  display: flex;
  gap: 0.5rem;
}

.clear-button {
  padding: 0.5rem 1rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.clear-button:hover {
  background: #b91c1c;
}
</style>