<script setup lang="ts">
import Profile from './Profile.vue'
const props = defineProps({
  characters: Array,
  characterImages: Object,
  icons: Object,
})
</script>

<template>
  <div class="characters">
    <Profile
      v-for="character in characters"
      :key="character.id"
      :character="character"
      :characterImages="characterImages"
      :icons="icons"
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
  background-color: #f1ede4;
  border-radius: 8px;
  max-height: 80vh;
  overflow-y: auto;
}
</style>
