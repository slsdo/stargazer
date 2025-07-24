import type { CharacterType } from '../lib/types/character'
import type { ArtifactType } from '../lib/types/artifact'

/**
 * Extract filename from a full path
 */
export function extractFileName(path: string, removeExtension = true): string {
  const fileName = path.split('/').pop() || 'Unknown'
  return removeExtension ? fileName.replace(/\.\w+$/, '') : fileName
}

/**
 * Load assets and return them as a dictionary keyed by filename
 */
function loadAssetsDict<T>(assets: Record<string, T>): Record<string, T> {
  return Object.fromEntries(
    Object.entries(assets).map(([path, asset]) => {
      const fileName = extractFileName(path)
      return [fileName, asset]
    }),
  )
}

// Module-level cache for data
let charactersCache: CharacterType[] | null = null
let artifactsCache: ArtifactType[] | null = null
let characterImagesCache: Record<string, string> | null = null
let artifactImagesCache: Record<string, string> | null = null
let iconsCache: Record<string, string> | null = null
let characterRangesCache: Map<string, number> | null = null

/**
 * Load all character data from JSON files
 */
export function loadCharacters(): CharacterType[] {
  if (charactersCache) {
    return charactersCache
  }

  const characters = (
    Object.values(
      import.meta.glob('../data/character/*.json', { eager: true, import: 'default' }),
    ) as CharacterType[]
  ).sort((a, b) => a.faction.localeCompare(b.faction))

  charactersCache = characters

  // Build character ranges map
  characterRangesCache = new Map<string, number>()
  characters.forEach((char) => {
    characterRangesCache!.set(char.id, char.range)
  })

  return characters
}

/**
 * Load all artifact data from JSON files
 */
export function loadArtifacts(): ArtifactType[] {
  if (artifactsCache) {
    return artifactsCache
  }

  const artifacts = (
    Object.values(
      import.meta.glob('../data/artifact/*.json', { eager: true, import: 'default' }),
    ) as ArtifactType[]
  ).sort((a, b) => a.id.localeCompare(b.id))

  artifactsCache = artifacts
  return artifacts
}

/**
 * Load character images
 */
export function loadCharacterImages(): Record<string, string> {
  if (characterImagesCache) {
    return characterImagesCache
  }

  const images = loadAssetsDict(
    import.meta.glob('../assets/images/character/*.png', {
      eager: true,
      import: 'default',
    }) as Record<string, string>,
  )

  characterImagesCache = images
  return images
}

/**
 * Load artifact images
 */
export function loadArtifactImages(): Record<string, string> {
  if (artifactImagesCache) {
    return artifactImagesCache
  }

  const images = loadAssetsDict(
    import.meta.glob('../assets/images/artifact/*.png', {
      eager: true,
      import: 'default',
    }) as Record<string, string>,
  )

  artifactImagesCache = images
  return images
}

/**
 * Load icon images
 */
export function loadIcons(): Record<string, string> {
  if (iconsCache) {
    return iconsCache
  }

  const icons = loadAssetsDict(
    import.meta.glob('../assets/images/icons/*.png', {
      eager: true,
      import: 'default',
    }) as Record<string, string>,
  )

  iconsCache = icons
  return icons
}

/**
 * Get character ranges map
 */
export function getCharacterRanges(): Map<string, number> {
  if (!characterRangesCache) {
    // Ensure characters are loaded first
    loadCharacters()
  }
  return characterRangesCache!
}

/**
 * Load all data at once
 */
export function loadAllData() {
  const characters = loadCharacters()
  const artifacts = loadArtifacts()
  const characterImages = loadCharacterImages()
  const artifactImages = loadArtifactImages()
  const icons = loadIcons()

  return {
    characters,
    artifacts,
    characterImages,
    artifactImages,
    icons,
    characterRanges: getCharacterRanges(),
  }
}

/**
 * Clear all cached data (useful for testing)
 */
export function clearCache() {
  charactersCache = null
  artifactsCache = null
  characterImagesCache = null
  artifactImagesCache = null
  iconsCache = null
  characterRangesCache = null
}
