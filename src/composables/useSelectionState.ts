import { ref } from 'vue'
import { Team } from '../lib/types/team'
import { useCharacterStore } from '../stores/character'
import { useArtifactStore } from '../stores/artifact'

// Shared state across all components
const selectedTeam = ref<Team>(Team.ALLY)

export function useSelectionState() {
  const characterStore = useCharacterStore()
  const artifactStore = useArtifactStore()

  const handleTeamChange = (team: Team) => {
    selectedTeam.value = team
  }

  const handleClearAll = () => {
    characterStore.clearAllCharacters()
    artifactStore.clearAllArtifacts()
  }

  return {
    selectedTeam,
    characterStore,
    artifactStore,
    handleTeamChange,
    handleClearAll,
  }
}