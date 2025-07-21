<script setup lang="ts">
import SelectionProfile from './SelectionProfile.vue'
import type { CharacterType } from '../types/character'
import { ref } from 'vue'
import { useGridStore } from '../stores/grid'

defineProps<{
  characters: CharacterType[]
  characterImages: { [key: string]: string }
  icons: { [key: string]: string }
  isDraggable?: boolean
}>()

const selectedTeam = ref<'Ally' | 'Enemy'>('Ally')
const gridStore = useGridStore()

const setTeam = (team: 'Ally' | 'Enemy') => {
  selectedTeam.value = team
}

const isCharacterPlaced = (characterId: string): boolean => {
  // Get all tiles with characters
  const tilesWithCharacters = gridStore.getTilesWithCharacters()

  // Check if this character is placed for the current selected team
  return tilesWithCharacters.some(
    (tile) => tile.character === characterId && tile.team === selectedTeam.value,
  )
}

const handleCharacterClick = (character: CharacterType) => {
  console.log('Character clicked:', character.id, 'team:', selectedTeam.value)

  // Check if character is already placed for current team
  if (isCharacterPlaced(character.id)) {
    console.log('Character already placed for team', selectedTeam.value, '- removing from grid')
    removeCharacterFromGrid(character.id)
    return
  }

  // Attempt to auto-place the character
  const success = gridStore.autoPlaceCharacter(character.id, selectedTeam.value)
  if (success) {
    console.log('Character', character.id, 'successfully auto-placed')
  } else {
    console.log('Failed to auto-place character', character.id)
  }
}

const removeCharacterFromGrid = (characterId: string) => {
  // Find the hex where this character is placed for the current team
  const tilesWithCharacters = gridStore.getTilesWithCharacters()
  const characterTile = tilesWithCharacters.find(
    (tile) => tile.character === characterId && tile.team === selectedTeam.value,
  )

  if (characterTile) {
    console.log('Removing character', characterId, 'from hex', characterTile.hex.getId())
    gridStore.removeCharacterFromHex(characterTile.hex.getId())
  } else {
    console.log('Character', characterId, 'not found on grid for team', selectedTeam.value)
  }
}
</script>

<template>
  <div class="character-selection">
    <!-- Team Toggle with Availability -->
    <div class="team-toggle">
      <button @click="setTeam('Ally')" :class="['team-btn', { active: selectedTeam === 'Ally' }]">
        Ally ({{ gridStore.availableAlly }}/5)
      </button>
      <button @click="setTeam('Enemy')" :class="['team-btn', { active: selectedTeam === 'Enemy' }]">
        Enemy ({{ gridStore.availableEnemy }}/5)
      </button>
    </div>

    <!-- Characters Grid -->
    <div class="characters">
      <SelectionProfile
        v-for="character in characters"
        :key="character.id"
        :character="{ ...character, team: selectedTeam }"
        :characterImage="characterImages[character.id]"
        :icons="icons"
        :isDraggable="isDraggable"
        :isPlaced="isCharacterPlaced(character.id)"
        @character-click="handleCharacterClick"
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
  width: fit-content;
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
  width: 160px;
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
