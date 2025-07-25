<script setup lang="ts">
import { computed } from 'vue'
import Character from './Character.vue'
import SelectionContainer from './SelectionContainer.vue'
import type { CharacterType } from '../lib/types/character'
import { useSelectionState } from '../composables/useSelectionState'

const props = defineProps<{
  characters: readonly CharacterType[]
  characterImages: Readonly<Record<string, string>>
  icons: Readonly<Record<string, string>>
  isDraggable?: boolean
}>()

const { selectedTeam, characterStore } = useSelectionState()

const sortedCharacters = computed(() =>
  [...props.characters].sort(
    (a, b) =>
      a.faction.localeCompare(b.faction) ||
      a.class.localeCompare(b.class) ||
      a.name.localeCompare(b.name),
  ),
)

const isCharacterPlaced = (characterId: number): boolean => {
  // Get all tiles with characters
  const tilesWithCharacters = characterStore.getTilesWithCharacters()

  // Check if this character is placed for the current selected team
  return tilesWithCharacters.some(
    (tile) => tile.characterId === characterId && tile.team === selectedTeam.value,
  )
}

const handleCharacterClick = (character: CharacterType) => {
  // Check if character is already placed for current team
  if (isCharacterPlaced(character.id)) {
    removeCharacterFromGrid(character.id)
    return
  }

  // Attempt to auto-place the character
  characterStore.autoPlaceCharacter(character.id, selectedTeam.value)
}

const removeCharacterFromGrid = (characterId: number) => {
  // Find the hex where this character is placed for the current team
  const tilesWithCharacters = characterStore.getTilesWithCharacters()
  const characterTile = tilesWithCharacters.find(
    (tile) => tile.characterId === characterId && tile.team === selectedTeam.value,
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
        v-for="character in sortedCharacters"
        :key="character.id"
        :character="{ ...character, team: selectedTeam }"
        :characterImage="characterImages[character.name]"
        :icons="icons"
        :isDraggable="isDraggable"
        :isPlaced="isCharacterPlaced(character.id)"
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
