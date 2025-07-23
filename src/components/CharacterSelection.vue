<script setup lang="ts">
import Character from './Character.vue'
import TeamToggle from './TeamToggle.vue'
import ClearButton from './ClearButton.vue'
import type { CharacterType } from '../lib/types/character'
import { Team } from '../lib/types/team'
import { ref } from 'vue'
import { useGridStore } from '../stores/grid'

defineProps<{
  characters: readonly CharacterType[]
  characterImages: Readonly<Record<string, string>>
  icons: Readonly<Record<string, string>>
  isDraggable?: boolean
}>()

const selectedTeam = ref<Team>(Team.ALLY)
const gridStore = useGridStore()

const handleTeamChange = (team: Team) => {
  selectedTeam.value = team
}

const handleClearAll = () => {
  gridStore.clearAllCharacters()
  gridStore.clearAllArtifacts()
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
  // Check if character is already placed for current team
  if (isCharacterPlaced(character.id)) {
    removeCharacterFromGrid(character.id)
    return
  }

  // Attempt to auto-place the character
  const success = gridStore.autoPlaceCharacter(character.id, selectedTeam.value)
  if (success) {
  } else {
  }
}

const removeCharacterFromGrid = (characterId: string) => {
  // Find the hex where this character is placed for the current team
  const tilesWithCharacters = gridStore.getTilesWithCharacters()
  const characterTile = tilesWithCharacters.find(
    (tile) => tile.character === characterId && tile.team === selectedTeam.value,
  )

  if (characterTile) {
    gridStore.removeCharacterFromHex(characterTile.hex.getId())
  } else {
  }
}
</script>

<template>
  <div class="character-selection">
    <!-- Team Toggle with Availability -->
    <div class="controls-row">
      <TeamToggle
        :selectedTeam="selectedTeam"
        :showCounts="true"
        :allyCount="gridStore.availableAlly"
        :enemyCount="gridStore.availableEnemy"
        :maxCount="5"
        @team-change="handleTeamChange"
      />
      <ClearButton @click="handleClearAll" />
    </div>

    <!-- Characters Grid -->
    <div class="characters">
      <Character
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
  gap: var(--spacing-lg);
}

.controls-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--spacing-lg);
}

.characters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xl);
  justify-content: center;
  padding: var(--spacing-lg);
  background-color: var(--color-bg-light-gray);
  border-radius: var(--radius-large);
  max-height: 70vh;
  overflow-y: auto;
}
</style>
