/**
 * Utility for loading assets with import.meta.glob
 */

/**
 * Extract filename from a full path
 */
export const extractFileName = (path: string, removeExtension = true): string => {
  const fileName = path.split('/').pop() || 'Unknown'
  return removeExtension ? fileName.replace(/\.\w+$/, '') : fileName
}

/**
 * Load assets and return them as a dictionary keyed by filename
 * Note: This is a helper function to reduce code duplication in asset loading patterns
 */
export const loadAssetsDict = <T>(assets: Record<string, T>): Record<string, T> => {
  return Object.fromEntries(
    Object.entries(assets).map(([path, asset]) => {
      const fileName = extractFileName(path)
      return [fileName, asset]
    }),
  )
}
