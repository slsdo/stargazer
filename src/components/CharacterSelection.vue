<script setup lang="ts">
import Profile from './Profile.vue'
import type { CharacterType } from '../types/character'
import { ref } from 'vue'
import { useGridStore } from '../stores/grid'

defineProps<{
  characters: CharacterType[]
  characterImages: { [key: string]: string }
  icons: { [key: string]: string }
  isDraggable?: boolean
}>()

const selectedTeam = ref<'Self' | 'Enemy'>('Self')
const gridStore = useGridStore()

const setTeam = (team: 'Self' | 'Enemy') => {
  selectedTeam.value = team
}
</script>

<template>
  <div class="character-selection">
    <!-- Team Toggle with Availability -->
    <div class="team-toggle">
      <button @click="setTeam('Self')" :class="['team-btn', { active: selectedTeam === 'Self' }]">
        Self ({{ gridStore.availableSelf }}/5)
      </button>
      <button @click="setTeam('Enemy')" :class="['team-btn', { active: selectedTeam === 'Enemy' }]">
        Enemy ({{ gridStore.availableEnemy }}/5)
      </button>
    </div>

    <!-- Characters Grid -->
    <div class="characters">
      <Profile
        v-for="character in characters"
        :key="character.id"
        :character="{ ...character, team: selectedTeam }"
        :characterImage="characterImages[character.id]"
        :icons="icons"
        :isDraggable="isDraggable"
      />
    </div>
  </div>
</template>

<style scoped>
.character-selection {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.team-toggle {
  display: flex;
  justify-content: center;
  gap: 0;
  background: #e8e4d9;
  border-radius: 8px;
  padding: 4px;
  border: 2px solid #d4cfc0;
}

.team-btn {
  background: transparent;
  color: #666;
  border: none;
  padding: 0.75rem 2rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
  border-radius: 6px;
  flex: 1;
}

.team-btn:hover {
  background: #f0ebe0;
  color: #36958e;
}

.team-btn.active {
  background: #36958e;
  color: white;
}

.characters {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  padding: 1rem;
  background-color: #f0f0f0;
  border-radius: 8px;
  max-height: 70vh;
  overflow-y: auto;
}
</style>
