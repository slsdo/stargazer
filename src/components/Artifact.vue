<script setup lang="ts">
import type { ArtifactType } from '../lib/types/artifact'

const props = defineProps<{
  artifact: ArtifactType
  artifactImage: string
  isPlaced?: boolean
}>()

const emit = defineEmits<{
  artifactClick: [artifact: ArtifactType]
}>()

const handleClick = () => {
  emit('artifactClick', props.artifact)
}
</script>

<template>
  <div
    class="artifact"
    :class="[`season-${artifact.season}`, { placed: isPlaced }]"
    @click="handleClick"
  >
    <img :src="artifactImage" :alt="artifact.id" class="portrait" />
  </div>
</template>

<style scoped>
.artifact {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 2px solid #fff;
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
  cursor: pointer;
  transition: transform 0.2s ease;
}

.artifact::before {
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
  z-index: 1;
  transform: translateY(-9px) translateX(1.5px);
}

.artifact:hover {
  transform: scale(1.05);
}

.season-0 {
  background: linear-gradient(135deg, #8e44ad, #3498db);
}

.season-1 {
  background: linear-gradient(135deg, #e74c3c, #f39c12);
}

.artifact.placed {
  box-shadow: 0 0 0 5px #c05b4d;
}
</style>
