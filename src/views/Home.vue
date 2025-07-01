<script setup lang="ts">
import CharacterSelection from '../components/CharacterSelection.vue'
import type { Character } from '../types/character'

const characters: Character[] = Object.values(
  import.meta.glob('../data/character/*.json', { eager: true, import: 'default' }),
)

const characterImages = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/images/character/*.png', { eager: true, import: 'default' }),
  ).map(([path, src]) => [path.split('/').pop().replace('.png', ''), src]),
)

const icons = Object.fromEntries(
  Object.entries(
    import.meta.glob('../assets/images/icons/*.png', { eager: true, import: 'default' }),
  ).map(([path, src]) => [path.split('/').pop().replace('.png', ''), src]),
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

.character {
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  margin-top: 0.25rem;
  color: #333;
}

.character img.portrait {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border: 2px solid #484848;
  border-radius: 50%;
  z-index: 1;
}

.level-s {
  background: url('@/assets/images/icons/bg-s.png') center/cover;
}

.level-a {
  background: url('@/assets/images/icons/bg-a.png') center/cover;
}

.profile {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0 5px #fff;
}

.profile::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #fff3 /* white with alpha, shorthand for rgba(255,255,255,0.53) */;
}

.info {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 0.4rem;
}

.info img {
  width: 24px;
  height: 24px;
  border: 1px solid #484848;
  border-radius: 50%;
}

@media (max-width: 480px) {
  .characters {
    gap: 0.5rem;
  }

  .character img {
    width: 70px;
    height: 70px;
  }
}
</style>
