<script setup lang="ts">
import Artifact from './Artifact.vue'
import SelectionContainer from './SelectionContainer.vue'
import type { ArtifactType } from '../lib/types/artifact'
import { Team } from '../lib/types/team'
import { useSelectionState } from '../composables/useSelectionState'

const props = defineProps<{
  artifacts: readonly ArtifactType[]
  artifactImages: Readonly<Record<string, string>>
  icons: Readonly<Record<string, string>>
}>()

const { selectedTeam, artifactStore } = useSelectionState()

const handleArtifactClick = (artifact: ArtifactType) => {
  // Check if this artifact is already placed for the selected team
  const isAlreadyPlaced =
    (selectedTeam.value === Team.ALLY && artifactStore.allyArtifact === artifact.name) ||
    (selectedTeam.value === Team.ENEMY && artifactStore.enemyArtifact === artifact.name)

  if (isAlreadyPlaced) {
    // Remove the artifact if it's already placed
    artifactStore.removeArtifact(selectedTeam.value)
  } else {
    // Place artifact for the selected team
    artifactStore.placeArtifact(artifact.name, selectedTeam.value)
  }
}

const isArtifactPlaced = (artifactId: string): boolean => {
  return artifactStore.allyArtifact === artifactId || artifactStore.enemyArtifact === artifactId
}
</script>

<template>
  <SelectionContainer containerClass="artifact-selection" :showCounts="false">
    <!-- Artifacts Grid -->
    <div class="artifacts">
      <div v-for="artifact in props.artifacts" :key="artifact.name" class="artifact-profile">
        <Artifact
          :artifact="artifact"
          :artifactImage="artifactImages[artifact.name]"
          :isPlaced="isArtifactPlaced(artifact.name)"
          @artifact-click="handleArtifactClick"
        />
      </div>
    </div>
  </SelectionContainer>
</template>

<style scoped>
.artifact-selection {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.artifacts {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xl);
  justify-content: flex-start;
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
