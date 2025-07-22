<script setup lang="ts">
import { Team } from '../lib/types/team'

const props = defineProps<{
  allyArtifact?: string | null
  enemyArtifact?: string | null
  artifactImages: Record<string, string>
}>()

const emit = defineEmits<{
  artifactClick: [team: Team]
}>()

const handleArtifactClick = (team: Team) => {
  emit('artifactClick', team)
}
</script>

<template>
  <div class="artifact-displays">
    <!-- Ally Artifact (bottom left) -->
    <div
      v-if="allyArtifact"
      class="artifact-display ally-artifact"
      @click="handleArtifactClick(Team.ALLY)"
    >
      <img :src="artifactImages[allyArtifact]" :alt="allyArtifact" class="artifact-portrait" />
    </div>

    <!-- Enemy Artifact (top right) -->
    <div
      v-if="enemyArtifact"
      class="artifact-display enemy-artifact"
      @click="handleArtifactClick(Team.ENEMY)"
    >
      <img :src="artifactImages[enemyArtifact]" :alt="enemyArtifact" class="artifact-portrait" />
    </div>
  </div>
</template>

<style scoped>
.artifact-displays {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.artifact-display {
  position: absolute;
  z-index: 10;
  width: 45px;
  height: 45px;
  border-radius: var(--radius-round);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 2px solid var(--color-bg-white);
  box-shadow: 0 0 0 3px #999;
  cursor: pointer;
  pointer-events: auto;
}

.ally-artifact {
  bottom: 25px;
  left: 55px;
}

.enemy-artifact {
  top: 25px;
  right: 55px;
}

.artifact-portrait {
  width: 95px;
  height: 95px;
  object-fit: cover;
  z-index: 1;
  transform: translateY(-8px) translateX(1px);
}
</style>
