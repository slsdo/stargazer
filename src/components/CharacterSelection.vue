<script setup lang="ts">
import Character from './Character.vue'
import SelectionContainer from './SelectionContainer.vue'
import type { CharacterType } from '../lib/types/character'
import { useSelectionState } from '../composables/useSelectionState'

defineProps<{
  characters: readonly CharacterType[]
  characterImages: Readonly<Record<string, string>>
  icons: Readonly<Record<string, string>>
  isDraggable?: boolean
}>()

const { selectedTeam, characterStore } = useSelectionState()

const isCharacterPlaced = (characterName: string): boolean => {
  // Get all tiles with characters
  const tilesWithCharacters = characterStore.getTilesWithCharacters()

  // Check if this character is placed for the current selected team
  return tilesWithCharacters.some(
    (tile) => tile.character === characterName && tile.team === selectedTeam.value,
  )
}

const handleCharacterClick = (character: CharacterType) => {
  // Check if character is already placed for current team
  if (isCharacterPlaced(character.name)) {
    removeCharacterFromGrid(character.name)
    return
  }

  // Attempt to auto-place the character
  characterStore.autoPlaceCharacter(character.name, selectedTeam.value)
}

const removeCharacterFromGrid = (characterName: string) => {
  // Find the hex where this character is placed for the current team
  const tilesWithCharacters = characterStore.getTilesWithCharacters()
  const characterTile = tilesWithCharacters.find(
    (tile) => tile.character === characterName && tile.team === selectedTeam.value,
  )

  if (characterTile) {
    characterStore.removeCharacterFromHex(characterTile.hex.getId())
  }
}
</script>

<template>
  <SelectionContainer
    containerClass="character-selection"
    :showCounts="true"
    :allyCount="characterStore.availableAlly"
    :enemyCount="characterStore.availableEnemy"
    :maxCount="5"
  >
    <!-- Characters Grid -->
    <div class="characters">
      <Character
        v-for="character in characters"
        :key="character.name"
        :character="{ ...character, team: selectedTeam }"
        :characterImage="characterImages[character.name]"
        :icons="icons"
        :isDraggable="isDraggable"
        :isPlaced="isCharacterPlaced(character.name)"
        @character-click="handleCharacterClick"
      />
    </div>
  </SelectionContainer>
</template>

<style scoped>
.character-selection {
  display: flex;
  flex-direction: column;
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
}
</style>
