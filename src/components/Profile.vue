<script setup lang="ts">
import Character from './Character.vue'
const props = defineProps({
  character: Object,
  characterImages: Object,
  icons: Object,
})
</script>

<template>
  <div class="profile">
    <div class="character" :class="`level-${character.level}`">
      <img :src="characterImages[character.id]" :alt="character.id" class="portrait" />
    </div>
    <div class="info">
      <img :src="icons[`faction-${character.faction}`]" :alt="character.faction" class="icon" />
      <img :src="icons[`class-${character.class}`]" :alt="character.class" class="icon" />
    </div>
  </div>
</template>

<style scoped>
.profile {
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  margin-top: 0.25rem;
  color: #333;
}

.character {
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

.character::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #fff3;
}

.portrait {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border: 2px solid #484848;
  border-radius: 50%;
  z-index: 1;
}

.info {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 0.4rem;
}

.icon {
  width: 24px;
  height: 24px;
  border: 1px solid #484848;
  border-radius: 50%;
}
</style>
