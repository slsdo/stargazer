import type { CharacterType } from '../lib/types/character'
import type { ArtifactType } from '../lib/types/artifact'
import { loadAssetsDict } from '../utils/assetLoader'

/**
 * DataManager service - centralized data loading and caching
 * Handles loading of characters, artifacts, and assets
 */
class DataManager {
  private static instance: DataManager
  
  // Cached data
  private charactersCache: CharacterType[] | null = null
  private artifactsCache: ArtifactType[] | null = null
  private characterImagesCache: Record<string, string> | null = null
  private artifactImagesCache: Record<string, string> | null = null
  private iconsCache: Record<string, string> | null = null
  private characterRangesCache: Map<string, number> | null = null

  // Private constructor for singleton pattern
  private constructor() {}

  // Get singleton instance
  static getInstance(): DataManager {
    if (!DataManager.instance) {
      DataManager.instance = new DataManager()
    }
    return DataManager.instance
  }

  /**
   * Load all character data from JSON files
   */
  loadCharacters(): CharacterType[] {
    if (this.charactersCache) {
      return this.charactersCache
    }

    const characters = (
      Object.values(
        import.meta.glob('../data/character/*.json', { eager: true, import: 'default' }),
      ) as CharacterType[]
    ).sort((a, b) => a.faction.localeCompare(b.faction))

    this.charactersCache = characters
    
    // Build character ranges map
    this.characterRangesCache = new Map<string, number>()
    characters.forEach((char) => {
      this.characterRangesCache!.set(char.id, char.range)
    })

    return characters
  }

  /**
   * Load all artifact data from JSON files
   */
  loadArtifacts(): ArtifactType[] {
    if (this.artifactsCache) {
      return this.artifactsCache
    }

    const artifacts = (
      Object.values(
        import.meta.glob('../data/artifact/*.json', { eager: true, import: 'default' }),
      ) as ArtifactType[]
    ).sort((a, b) => a.id.localeCompare(b.id))

    this.artifactsCache = artifacts
    return artifacts
  }

  /**
   * Load character images
   */
  loadCharacterImages(): Record<string, string> {
    if (this.characterImagesCache) {
      return this.characterImagesCache
    }

    const images = loadAssetsDict(
      import.meta.glob('../assets/images/character/*.png', {
        eager: true,
        import: 'default',
      }) as Record<string, string>,
    )

    this.characterImagesCache = images
    return images
  }

  /**
   * Load artifact images
   */
  loadArtifactImages(): Record<string, string> {
    if (this.artifactImagesCache) {
      return this.artifactImagesCache
    }

    const images = loadAssetsDict(
      import.meta.glob('../assets/images/artifact/*.png', {
        eager: true,
        import: 'default',
      }) as Record<string, string>,
    )

    this.artifactImagesCache = images
    return images
  }

  /**
   * Load icon images
   */
  loadIcons(): Record<string, string> {
    if (this.iconsCache) {
      return this.iconsCache
    }

    const icons = loadAssetsDict(
      import.meta.glob('../assets/images/icons/*.png', { 
        eager: true, 
        import: 'default' 
      }) as Record<string, string>,
    )

    this.iconsCache = icons
    return icons
  }

  /**
   * Get character ranges map
   */
  getCharacterRanges(): Map<string, number> {
    if (!this.characterRangesCache) {
      throw new Error('Characters must be loaded before accessing ranges')
    }
    return this.characterRangesCache
  }

  /**
   * Load all data at once
   */
  loadAllData() {
    const characters = this.loadCharacters()
    const artifacts = this.loadArtifacts()
    const characterImages = this.loadCharacterImages()
    const artifactImages = this.loadArtifactImages()
    const icons = this.loadIcons()

    return {
      characters,
      artifacts,
      characterImages,
      artifactImages,
      icons,
      characterRanges: this.getCharacterRanges(),
    }
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.charactersCache = null
    this.artifactsCache = null
    this.characterImagesCache = null
    this.artifactImagesCache = null
    this.iconsCache = null
    this.characterRangesCache = null
  }
}

// Export singleton instance
export const dataManager = DataManager.getInstance()