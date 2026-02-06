/**
 * Generic list service factory for creating consistent list fetching functions
 */

import { api } from '@/lib/api';
import { createCacheManager, DEFAULT_CACHE_DURATION } from './cache';
import { buildQueryParams, QueryBuilderConfig } from './query-builder';

export interface ListServiceConfig<TResponse, TOptions extends Record<string, any>> {
  /**
   * Base endpoint path (e.g., '/api/campaigns', '/api/zones')
   */
  endpoint: string;

  /**
   * Function to generate cache key from options
   * Simple services can just stringify options; complex ones can be selective
   */
  cacheKeyGenerator: (options?: TOptions) => string;

  /**
   * Cache duration in milliseconds
   * Defaults to 5 minutes
   */
  cacheDuration?: number;

  /**
   * Query builder configuration (transforms, omissions)
   */
  queryConfig?: QueryBuilderConfig;

  /**
   * Cache manager instance (optional - will create one if not provided)
   */
  cacheManager?: ReturnType<typeof createCacheManager<TResponse>>;
}

/**
 * Create a generic list service that handles caching and query building
 * 
 * @param config - Configuration for the list service
 * @returns A function that fetches list data with caching
 */
export function createListService<TResponse, TOptions extends Record<string, any>>(
  config: ListServiceConfig<TResponse, TOptions>
): {
  fetch: (options?: TOptions) => Promise<TResponse>;
  invalidateCache: (key?: string) => void;
} {
  const cacheManager = config.cacheManager || createCacheManager<TResponse>();
  const cacheDuration = config.cacheDuration ?? DEFAULT_CACHE_DURATION;

  const fetch = async (options?: TOptions): Promise<TResponse> => {
    // Generate cache key
    const cacheKey = config.cacheKeyGenerator(options);

    // Check cache if useCache is not explicitly false
    if (options?.useCache !== false) {
      const cached = cacheManager.get(cacheKey);
      if (cached !== null) {
        return cached;
      }
    }

    // Build query parameters
    const queryParams = buildQueryParams(options || {}, config.queryConfig);
    const queryString = queryParams.toString();
    const endpoint = queryString ? `${config.endpoint}?${queryString}` : config.endpoint;

    // Fetch from API
    const response = await api.get<TResponse>(endpoint);

    // Cache the response
    cacheManager.set(cacheKey, response, cacheDuration);

    return response;
  };

  return {
    fetch,
    invalidateCache: (key?: string) => cacheManager.invalidate(key),
  };
}

/**
 * Simple cache key generator that stringifies all options
 */
export function simpleCacheKeyGenerator(options?: Record<string, any>): string {
  if (!options) {
    return 'default';
  }
  // Sort keys for consistent cache keys
  const sorted = Object.keys(options)
    .sort()
    .reduce((acc, key) => {
      acc[key] = options[key];
      return acc;
    }, {} as Record<string, any>);
  
  return JSON.stringify(sorted);
}

/**
 * Cache key generator for active resource queries
 * Only caches when specific conditions are met (status=active, limit=1, sort=created_at, order=desc)
 */
export function activeResourceCacheKeyGenerator(
  resourceName: string
): (options?: Record<string, any>) => string {
  return (options?: Record<string, any>): string => {
    // Only use specific cache key when conditions match
    if (
      options?.status === 'active' && 
      options?.limit === 1 && 
      options?.sort === 'created_at' && 
      options?.order === 'desc'
    ) {
      return `active${resourceName}`;
    }
    
    // Otherwise use full options as cache key
    return simpleCacheKeyGenerator(options);
  };
}
