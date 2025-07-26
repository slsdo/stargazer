import { defineStore } from 'pinia'
import { ref, readonly } from 'vue'
import type { CharacterType } from '../lib/types/character'
import type { ArtifactType } from '../lib/types/artifact'
import { loadAllData } from '../utils/dataLoader'

export const useGameDataStore = defineStore('gameData', () => {
  // Data state
  const characters = ref<CharacterType[]>([])
  const artifacts = ref<ArtifactType[]>([])
  const characterImages = ref<Record<string, string>>({})
  const artifactImages = ref<Record<string, string>>({})
  const icons = ref<Record<string, string>>({})
  const dataLoaded = ref(false)

  // Character ranges - internal state
  const characterRanges = ref(new Map<number, number>())

  // Initialize all data using dataLoader
  const initializeData = () => {
    if (dataLoaded.value) {
      return // Already loaded
    }

    try {
      const data = loadAllData()

      // Update reactive state
      characters.value = data.characters
      artifacts.value = data.artifacts
      characterImages.value = data.characterImages
      artifactImages.value = data.artifactImages
      icons.value = data.icons
      characterRanges.value = data.characterRanges

      dataLoaded.value = true
    } catch (error) {
      console.error('Failed to initialize data:', error)
    }
  }

  // Helper to get character range by ID
  const getCharacterRange = (characterId: number): number => {
    return characterRanges.value.get(characterId) ?? 1
  }

  // Helper to get character by ID
  const getCharacterById = (characterId: number): CharacterType | undefined => {
    return characters.value.find(char => char.id === characterId)
  }

  // Helper to get character name by ID
  const getCharacterNameById = (characterId: number): string | undefined => {
    const character = getCharacterById(characterId)
    return character?.name
  }

  return {
    // State (readonly)
    characters: readonly(characters),
    artifacts: readonly(artifacts),
    characterImages: readonly(characterImages),
    artifactImages: readonly(artifactImages),
    icons: readonly(icons),
    dataLoaded: readonly(dataLoaded),

    // Actions
    initializeData,
    getCharacterRange,
    getCharacterById,
    getCharacterNameById,

    // Expose for other stores
    characterRanges: readonly(characterRanges),
  }
})
