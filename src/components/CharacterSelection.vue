<script setup lang="ts">
import Profile from './Profile.vue'
import type { CharacterType } from '../types/character'

defineProps<{
  characters: CharacterType[]
  characterImages: { [key: string]: string }
  icons: { [key: string]: string }
  isDraggable?: boolean
}>()
</script>

<template>
  <div class="characters">
    <Profile
      v-for="character in characters"
      :key="character.id"
      :character="character"
      :characterImage="characterImages[character.id]"
      :icons="icons"
      :isDraggable="isDraggable"
    />
  </div>
</template>

<style scoped>
.characters {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  padding: 1rem;
  background-color: #f0f0f0;
  border-radius: 8px;
  max-height: 80vh;
  overflow-y: auto;
}
</style>
