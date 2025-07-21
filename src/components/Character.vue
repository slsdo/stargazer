<script setup lang="ts">
import type { CharacterType } from '../types/character'
import { useDragDrop } from '../composables/useDragDrop'

const props = defineProps<{
  character: CharacterType
  characterImage: string
  isDraggable?: boolean
}>()

const { startDrag, endDrag } = useDragDrop()

const handleDragStart = (event: DragEvent) => {
  if (!props.isDraggable) return
  startDrag(event, props.character, props.character.id, props.characterImage)
}

const handleDragEnd = (event: DragEvent) => {
  if (!props.isDraggable) return
  endDrag(event)
}
</script>

<template>
  <div
    class="character"
    :class="[`level-${character.level}`, { draggable: isDraggable }]"
    :draggable="isDraggable"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
  >
    <img :src="characterImage" :alt="character.id" class="portrait" />
  </div>
</template>

<style scoped>
.character {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0 5px #fff;
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  margin-top: 0.25rem;
  color: #333;
}

.character::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #fff4;
}

.portrait {
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

.draggable {
  cursor: grab;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease;
}

.draggable:hover {
  transform: scale(1.05);
}

.draggable:active {
  cursor: grabbing;
}
</style>
