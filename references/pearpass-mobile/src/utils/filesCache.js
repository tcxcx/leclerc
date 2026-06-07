// Cache to avoid reloading the same files
// Uses FIFO (First In First Out) eviction when size limit is reached
export const fileCache = new Map()
export const MAX_CACHE_SIZE = 100

/**
 * Clear the entire file cache
 */
export const clearAllFileCache = () => {
  fileCache.clear()
}
