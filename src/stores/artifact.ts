import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import { Team } from '../lib/types/team'

export const useArtifactStore = defineStore('artifact', () => {
  // Artifact tracking
  const allyArtifact = ref<string | null>(null)
  const enemyArtifact = ref<string | null>(null)

  // Actions
  const placeArtifact = (artifactId: string, team: Team): boolean => {
    if (team === Team.ALLY) {
      allyArtifact.value = artifactId
    } else {
      enemyArtifact.value = artifactId
    }
    return true
  }

  const removeArtifact = (team: Team) => {
    if (team === Team.ALLY) {
      allyArtifact.value = null
    } else {
      enemyArtifact.value = null
    }
  }

  const clearAllArtifacts = () => {
    allyArtifact.value = null
    enemyArtifact.value = null
  }

  const getArtifact = (team: Team): string | null => {
    return team === Team.ALLY ? allyArtifact.value : enemyArtifact.value
  }

  return {
    // State (readonly)
    allyArtifact: readonly(allyArtifact),
    enemyArtifact: readonly(enemyArtifact),

    // Actions
    placeArtifact,
    removeArtifact,
    clearAllArtifacts,
    getArtifact,
  }
})
