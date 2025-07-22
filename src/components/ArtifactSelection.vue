<script setup lang="ts">
import Artifact from './Artifact.vue'
import TeamToggle from './TeamToggle.vue'
import ClearButton from './ClearButton.vue'
import type { ArtifactType } from '../lib/types/artifact'
import { Team } from '../lib/types/team'
import { ref } from 'vue'
import { useGridStore } from '../stores/grid'

const props = defineProps<{
  artifacts: ArtifactType[]
  artifactImages: { [key: string]: string }
  icons: { [key: string]: string }
}>()

const selectedTeam = ref<Team>(Team.ALLY)
const gridStore = useGridStore()

const handleTeamChange = (team: Team) => {
  selectedTeam.value = team
}

const handleArtifactClick = (artifact: ArtifactType) => {
  console.log('Artifact clicked:', artifact.id, 'for team:', selectedTeam.value)

  // Check if this artifact is already placed for the selected team
  const isAlreadyPlaced =
    (selectedTeam.value === Team.ALLY && gridStore.allyArtifact === artifact.id) ||
    (selectedTeam.value === Team.ENEMY && gridStore.enemyArtifact === artifact.id)

  if (isAlreadyPlaced) {
    // Remove the artifact if it's already placed
    gridStore.removeArtifact(selectedTeam.value)
    console.log('Artifact removed:', artifact.id, 'from team:', selectedTeam.value)
  } else {
    // Place artifact for the selected team
    gridStore.placeArtifact(artifact.id, selectedTeam.value)
    console.log('Artifact placed:', artifact.id, 'for team:', selectedTeam.value)
  }
}

const handleClearAll = () => {
  gridStore.clearAllCharacters()
  gridStore.clearAllArtifacts()
}

const isArtifactPlaced = (artifactId: string): boolean => {
  return gridStore.allyArtifact === artifactId || gridStore.enemyArtifact === artifactId
}
</script>

<template>
  <div class="artifact-selection">
    <!-- Team Toggle -->
    <div class="controls-row">
      <TeamToggle
        :selectedTeam="selectedTeam"
        :showCounts="false"
        @team-change="handleTeamChange"
      />
      <ClearButton @click="handleClearAll" />
    </div>

    <!-- Artifacts Grid -->
    <div class="artifacts">
      <div v-for="artifact in props.artifacts" :key="artifact.id" class="artifact-profile">
        <Artifact
          :artifact="artifact"
          :artifactImage="artifactImages[artifact.id]"
          :isPlaced="isArtifactPlaced(artifact.id)"
          @artifact-click="handleArtifactClick"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.artifact-selection {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.controls-row {
  display: flex;
  justify-content: left;
  align-items: center;
  gap: var(--spacing-lg);
}

.artifacts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xl);
  justify-content: center;
  padding: var(--spacing-lg);
  background-color: var(--color-bg-light-gray);
  border-radius: var(--radius-large);
  max-height: 70vh;
  overflow-y: auto;
}

.artifact-profile {
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  margin-top: var(--spacing-xs);
  color: var(--color-text-primary);
}

.artifact-info {
  display: flex;
  justify-content: center;
  padding-top: 0.4rem;
}
</style>
