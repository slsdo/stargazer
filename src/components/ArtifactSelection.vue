<script setup lang="ts">
import Artifact from './Artifact.vue'
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

const setTeam = (team: Team) => {
  selectedTeam.value = team
}

const handleArtifactClick = (artifact: ArtifactType) => {
  console.log('Artifact clicked:', artifact.id, 'for team:', selectedTeam.value)

  // Check if this artifact is already placed for the selected team
  const isAlreadyPlaced = (selectedTeam.value === Team.ALLY && gridStore.allyArtifact === artifact.id) ||
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

const clearAll = () => {
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
      <div class="team-toggle">
        <button
          @click="setTeam(Team.ALLY)"
          :class="['team-btn', { active: selectedTeam === Team.ALLY }]"
        >
          Ally
        </button>
        <button
          @click="setTeam(Team.ENEMY)"
          :class="['team-btn', { active: selectedTeam === Team.ENEMY }]"
        >
          Enemy
        </button>
      </div>
      <button @click="clearAll" class="clear-all-btn">Clear All</button>
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
  gap: 1rem;
}

.controls-row {
  display: flex;
  justify-content: left;
  align-items: center;
  gap: 1rem;
}

.team-toggle {
  display: flex;
  justify-content: center;
  gap: 0;
  background: #e8e4d9;
  border-radius: 8px;
  padding: 4px;
  border: 2px solid #d4cfc0;
  width: fit-content;
}

.team-btn {
  background: transparent;
  color: #666;
  border: none;
  padding: 0.75rem 2rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
  border-radius: 6px;
  width: 160px;
}

.team-btn:hover {
  background: #f0ebe0;
  color: #36958e;
}

.team-btn.active {
  background: #36958e;
  color: white;
}

.clear-all-btn {
  background: #c05b4d;
  color: white;
  border: 2px solid #c05b4d;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.clear-all-btn:hover {
  background: #c82333;
  border-color: #c82333;
}

.artifacts {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: center;
  padding: 1rem;
  background-color: #f0f0f0;
  border-radius: 8px;
  max-height: 70vh;
  overflow-y: auto;
}

.artifact-profile {
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
  margin-top: 0.25rem;
  color: #333;
}

.artifact-info {
  display: flex;
  justify-content: center;
  padding-top: 0.4rem;
}
</style>
