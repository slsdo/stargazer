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
    <img :src="artifactImage" :alt="artifact.name" class="portrait" />
  </div>
</template>

<style scoped>
.artifact {
  width: 50px;
  height: 50px;
  border-radius: var(--radius-round);
  border: 2px solid var(--color-bg-white);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 0 5px var(--color-bg-white);
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  margin-top: var(--spacing-xs);
  color: var(--color-text-primary);
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.artifact::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: var(--radius-round);
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
  background: #fff;
}

.artifact.placed {
  box-shadow: 0 0 0 5px var(--color-danger);
}
</style>
