/**
 * AssetFlow API Cache - Permanent until invalidated
 * Cache lives forever in memory — only clears when you add/edit/delete data
 * Resets on browser refresh (F5)
 */

const cache = new Map();

/**
 * Fetch data and cache it permanently until invalidated
 * @param {string} key       - Cache key
 * @param {Function} fetcher - Async function that returns data
 */
export async function cachedAPI(key, fetcher) {
  if (cache.has(key)) {
    return cache.get(key);  // return instantly, no TTL check
  }
  const data = await fetcher();
  cache.set(key, data);
  return data;
}

/**
 * Force refresh a key — fetches fresh data and updates cache
 */
export async function refreshCache(key, fetcher) {
  const data = await fetcher();
  cache.set(key, data);
  return data;
}

/**
 * Invalidate cache entries (call after add/edit/delete)
 * @param {string|string[]} keys
 */
export function invalidateCache(keys) {
  const list = Array.isArray(keys) ? keys : [keys];
  list.forEach(k => cache.delete(k));
}

/** Clear everything (on logout) */
export function clearCache() {
  cache.clear();
}

/** Check if a key is cached */
export function isCached(key) {
  return cache.has(key);
}
