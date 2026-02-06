import { api } from '@/lib/api';
import { ZonesResponse, Zone } from '@/types/api';
import { syncZone } from './sync';
import { createCacheManager, DEFAULT_CACHE_DURATION } from './cache';
import { createListService, activeResourceCacheKeyGenerator } from './list-service-factory';
import { stripTimestampSuffix } from './query-builder';

// Cache manager for zone lists
const listCacheManager = createCacheManager<ZonesResponse>();

// Create the generic list service for zones
const zoneListService = createListService<ZonesResponse, {
  status?: 'active' | 'inactive';
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  useCache?: boolean;
  _t?: string;
}>({
  endpoint: '/api/zones',
  cacheKeyGenerator: activeResourceCacheKeyGenerator('Zones'),
  cacheDuration: DEFAULT_CACHE_DURATION,
  cacheManager: listCacheManager,
  queryConfig: {
    transforms: {
      sort: stripTimestampSuffix,
    },
    omit: ['useCache'],
  },
});

/**
 * Fetch zones with optional filtering options
 */
export async function getZones(options?: {
  status?: 'active' | 'inactive';
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  useCache?: boolean;
  _t?: string; // Timestamp for cache busting
}): Promise<ZonesResponse> {
  return zoneListService.fetch(options);
}

/**
 * Fetch active zones
 */
export async function getActiveZones(limit: number = 10): Promise<ZonesResponse> {
  return getZones({
    status: 'active',
    limit,
    sort: 'created_at',
    order: 'desc',
    useCache: true
  });
}

/**
 * Get the count of active zones
 */
export async function getActiveZonesCount(): Promise<number> {
  try {
    const response = await getActiveZones(1);
    return response.pagination.total;
  } catch (error) {
    // Return 0 on error
    return 0;
  }
}

/**
 * Create a new zone.
 * API may return either { zone: Zone } or the zone object directly (e.g. { id, status, created_at } with id as UUID string).
 */
export async function createZone(zoneData: {
  name: string;
  site_url?: string;
  traffic_back_url?: string;
  postback_url?: string;
}): Promise<Zone> {
  const response = await api.post<{ zone?: Zone } & Partial<Zone>>('/api/zones', zoneData);
  
  // Normalize: API can return { zone: Zone } or the zone object directly
  const raw = response && typeof response === 'object' && 'zone' in response && response.zone
    ? response.zone
    : response && typeof response === 'object' && 'id' in response
      ? (response as Partial<Zone>)
      : null;
  
  if (!raw || raw.id === undefined) {
    throw new Error('Invalid create zone response: missing zone data');
  }
  
  const zone: Zone = {
    id: raw.id,
    name: raw.name ?? zoneData.name,
    site_url: raw.site_url ?? zoneData.site_url ?? '',
    traffic_back_url: raw.traffic_back_url ?? zoneData.traffic_back_url ?? '',
    postback_url: raw.postback_url ?? zoneData.postback_url,
    status: raw.status ?? 'active',
    created_at: raw.created_at ?? Date.now(),
    updated_at: raw.updated_at ?? raw.created_at ?? Date.now(),
  };
  
  // Invalidate all cache after creating a new zone
  listCacheManager.invalidate();
  
  // Sync newly created zone to KV storage (id may be number or UUID string)
  try {
    await syncZone(zone.id);
  } catch (syncError) {
    console.error(`Failed to sync new zone ${zone.id}:`, syncError);
    // Don't rethrow, as the zone creation was successful
  }
  
  return zone;
}

/**
 * Update an existing zone
 * @param id - Zone ID (number or UUID string)
 */
export async function updateZone(
  id: number | string,
  zoneData: {
    name?: string;
    site_url?: string;
    traffic_back_url?: string;
    postback_url?: string;
    status?: 'active' | 'inactive';
  }
): Promise<Zone> {
  try {
    const response = await api.put<{ zone: Zone }>(`/api/zones/${id}`, zoneData);
    
    // Invalidate all cache after updating a zone
    listCacheManager.invalidate();
    
    // Sync zone to KV storage after any update (status, name, URLs, etc.)
    try {
      await syncZone(id);
    } catch (syncError) {
      console.error(`Failed to sync zone ${id} after update:`, syncError);
      // Don't rethrow, as the zone update was successful
    }
    
    return response.zone;
  } catch (error) {
    throw error;
  }
}

/**
 * Delete a zone (only inactive zones should be deleted).
 * @param id - Zone ID (number or UUID string)
 */
export async function deleteZone(id: number | string): Promise<void> {
  await api.delete(`/api/zones/${id}`);

  // Invalidate all cache after deleting a zone
  listCacheManager.invalidate();
}

/**
 * Get a specific zone by ID
 * @param id - Zone ID (number or UUID string)
 */
export async function getZone(id: number | string): Promise<Zone> {
  try {
    // Log the API call for debugging
    console.log(`Fetching zone with ID: ${id}`);
    
    // According to API docs, the response format is likely to be a direct object,
    // not wrapped in a 'zone' property like { zone: {...} }
    const response = await api.get<Zone>(`/api/zones/${id}`);
    console.log('API response for getZone:', response);
    
    // Check if the response itself is the zone data
    if (response && typeof response === 'object' && 'id' in response) {
      return response;
    }
    
    // If the response contains a zone property, use that
    if (response && typeof response === 'object' && 'zone' in response) {
      return (response as any).zone;
    }
    
    throw new Error('Invalid zone data format received from API');
  } catch (error) {
    console.error('Error in getZone:', error);
    throw error;
  }
} 