/**
 * Generic cache utilities for service layer
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // milliseconds
}

export interface CacheManager<T> {
  get(key: string): T | null;
  set(key: string, data: T, ttl: number): void;
  invalidate(key?: string): void;
  isValid(entry: CacheEntry<T> | undefined): boolean;
}

/**
 * Create a type-safe cache manager instance
 */
export function createCacheManager<T>(): CacheManager<T> {
  const cache: Record<string, CacheEntry<T>> = {};

  return {
    /**
     * Get cached data if it exists and is still valid
     */
    get(key: string): T | null {
      const entry = cache[key];
      if (!entry) {
        return null;
      }

      if (!this.isValid(entry)) {
        delete cache[key];
        return null;
      }

      return entry.data;
    },

    /**
     * Store data in cache with TTL
     */
    set(key: string, data: T, ttl: number): void {
      cache[key] = {
        data,
        timestamp: Date.now(),
        expiresIn: ttl,
      };
    },

    /**
     * Invalidate cache entry or all cache
     */
    invalidate(key?: string): void {
      if (key) {
        delete cache[key];
      } else {
        // Clear all cache entries
        Object.keys(cache).forEach(k => {
          delete cache[k];
        });
      }
    },

    /**
     * Check if cache entry is still valid
     */
    isValid(entry: CacheEntry<T> | undefined): boolean {
      if (!entry) {
        return false;
      }
      return Date.now() - entry.timestamp < entry.expiresIn;
    },
  };
}

/**
 * Default cache duration (5 minutes)
 */
export const DEFAULT_CACHE_DURATION = 5 * 60 * 1000;
