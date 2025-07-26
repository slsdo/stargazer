<script setup lang="ts">
import type { CharacterType } from '../lib/types/character'
import { useDragDrop } from '../composables/useDragDrop'
import { ref } from 'vue'

const props = defineProps<{
  character: CharacterType
  characterImage: string
  icons: { [key: string]: string }
  isDraggable?: boolean
  isPlaced?: boolean
}>()

const emit = defineEmits<{
  characterClick: [character: CharacterType]
}>()

const { startDrag, endDrag } = useDragDrop()

// Click detection variables
const isMouseDown = ref(false)
const startTime = ref(0)
const CLICK_THRESHOLD = 200 // ms

const handleDragStart = (event: DragEvent) => {
  if (!props.isDraggable) return
  startDrag(event, props.character, props.character.id, props.characterImage)
}

const handleDragEnd = (event: DragEvent) => {
  if (!props.isDraggable) return
  endDrag(event)
}

const handleMouseDown = (event: MouseEvent) => {
  isMouseDown.value = true
  startTime.value = Date.now()
}

const handleMouseUp = (event: MouseEvent) => {
  if (!isMouseDown.value) return

  const endTime = Date.now()
  const clickDuration = endTime - startTime.value

  // Only emit click if it was a short press (not a drag)
  if (clickDuration < CLICK_THRESHOLD) {
    emit('characterClick', props.character)
  }

  isMouseDown.value = false
}
</script>

<template>
  <div class="character-wrapper">
    <div
      class="character-display"
      :class="[`level-${character.level}`, { draggable: isDraggable, placed: isPlaced }]"
      :draggable="isDraggable"
      @dragstart="handleDragStart"
      @dragend="handleDragEnd"
      @mousedown="handleMouseDown"
      @mouseup="handleMouseUp"
    >
      <img :src="characterImage" :alt="character.name" class="portrait" />
    </div>
    <div class="character-info">
      <img :src="icons[`faction-${character.faction}`]" :alt="character.faction" class="icon" />
      <img :src="icons[`class-${character.class}`]" :alt="character.class" class="icon" />
    </div>
  </div>
</template>

<style scoped>
.character-wrapper {
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  margin-top: 0.25rem;
  color: #333;
}

.character-display {
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

.character-display::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: #fff4;
}

.portrait {
  width: 70px;
  height: 70px;
  object-fit: cover;
  border: 2px solid #fff;
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

.character-display.placed {
  box-shadow: 0 0 0 5px #c05b4d;
}

.character-info {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  padding-top: 0.4rem;
}

.character-info img {
  width: 24px;
  height: 24px;
  border: 1px solid #484848;
  border-radius: 50%;
}

@media (max-width: 480px) {
  .characters {
    gap: 0.5rem;
  }
}
</style>
