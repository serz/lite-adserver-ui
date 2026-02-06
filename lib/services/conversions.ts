import { ConversionsResponse } from '@/types/api';
import { createListService, simpleCacheKeyGenerator } from './list-service-factory';
import { DEFAULT_CACHE_DURATION } from './cache';

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
