<script setup lang="ts">
import { Team } from '../lib/types/team'
import { useGridEvents } from '../composables/useGridEvents'
import { useGameDataStore } from '../stores/gameData'
import { computed } from 'vue'

const props = defineProps<{
  allyArtifactId?: number | null
  enemyArtifactId?: number | null
  artifactImages: Record<string, string>
}>()

const gridEvents = useGridEvents()
const gameDataStore = useGameDataStore()

// Convert artifact IDs to names for display
const allyArtifactName = computed(() => {
  if (props.allyArtifactId === null || props.allyArtifactId === undefined) return null
  const artifact = gameDataStore.getArtifactById(props.allyArtifactId)
  return artifact?.name || null
})

const enemyArtifactName = computed(() => {
  if (props.enemyArtifactId === null || props.enemyArtifactId === undefined) return null
  const artifact = gameDataStore.getArtifactById(props.enemyArtifactId)
  return artifact?.name || null
})

const handleArtifactClick = (team: Team) => {
  gridEvents.emit('artifact:remove', team)
}
</script>

<template>
  <div class="grid-artifacts">
    <!-- Ally Artifact (bottom left) -->
    <div
      v-if="allyArtifactName"
      class="grid-artifact ally-artifact"
      @click="handleArtifactClick(Team.ALLY)"
    >
      <img :src="artifactImages[allyArtifactName]" :alt="allyArtifactName" class="artifact-image" />
    </div>

    <!-- Enemy Artifact (top right) -->
    <div
      v-if="enemyArtifactName"
      class="grid-artifact enemy-artifact"
      @click="handleArtifactClick(Team.ENEMY)"
    >
      <img :src="artifactImages[enemyArtifactName]" :alt="enemyArtifactName" class="artifact-image" />
    </div>
  </div>
</template>

<style scoped>
.grid-artifacts {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.grid-artifact {
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
  left: 60px;
}

.enemy-artifact {
  top: 25px;
  right: 60px;
}

.artifact-image {
  width: 95px;
  height: 95px;
  object-fit: cover;
  z-index: 1;
  transform: translateY(-8px) translateX(1px);
}
</style>
