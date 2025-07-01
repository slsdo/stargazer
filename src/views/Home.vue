<script setup lang="ts">
import CharacterSelection from '../components/CharacterSelection.vue'
import type { CharacterType } from '../types/character'

const characters: CharacterType[] = Object.values(
  import.meta.glob('../data/character/*.json', { eager: true, import: 'default' }),
)

const characterImages = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/images/character/*.png', { eager: true, import: 'default' }),
  ).map(([path, src]) => [(path.split('/').pop() ?? '').replace('.png', ''), src as string]),
)

const icons = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/images/icons/*.png', { eager: true, import: 'default' }),
  ).map(([path, src]) => [(path.split('/').pop() ?? '').replace('.png', ''), src as string]),
)
</script>

<template>
  <main>
    <div class="content">
      <div class="grid">
        <h1>AFKJ Grid</h1>
        <div class="section">
          <p>Edit</p>
        </div>
      </div>

      <div class="section">
        <CharacterSelection
          :characters="characters"
          :characterImages="characterImages"
          :icons="icons"
        />
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  flex: 1;
  display: flex;
  justify-content: center;
  padding: 2rem 0;
}

.content {
  max-width: 1280px;
  width: 100%;
  padding: 0 2em;
  text-align: center;
}

.section {
  padding: 2em;
  margin: 2rem 0;
  color: #484848;
  background-color: #f8f5ec;
  border-radius: 8px;
}
</style>
