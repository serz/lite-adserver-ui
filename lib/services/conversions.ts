import { ConversionsResponse } from '@/types/api';
import { createListService, simpleCacheKeyGenerator } from './list-service-factory';
import { createCacheManager, DEFAULT_CACHE_DURATION } from './cache';

// Cache manager for conversions list
const conversionListCacheManager = createCacheManager<ConversionsResponse>();

// Create the generic list service for conversions
const conversionListService = createListService<ConversionsResponse, {
  limit?: number;
  offset?: number;
  sort?: 'ad_event_id' | 'click_id' | 'created_at';
  order?: 'asc' | 'desc';
  useCache?: boolean;
}>({
  endpoint: '/api/conversions',
  cacheKeyGenerator: simpleCacheKeyGenerator,
  cacheDuration: DEFAULT_CACHE_DURATION,
  cacheManager: conversionListCacheManager,
  queryConfig: {
    omit: ['useCache'],
  },
});

/**
 * Fetch conversions with optional pagination and sort options
 */
export async function getConversions(options?: {
  limit?: number;
  offset?: number;
  sort?: 'ad_event_id' | 'click_id' | 'created_at';
  order?: 'asc' | 'desc';
  useCache?: boolean;
}): Promise<ConversionsResponse> {
  return conversionListService.fetch(options);
}

/**
 * Invalidate cached conversions responses.
 * Use on logout/account switch to prevent cross-account stale data.
 */
export function invalidateConversionsCache(): void {
  conversionListCacheManager.invalidate();
}
