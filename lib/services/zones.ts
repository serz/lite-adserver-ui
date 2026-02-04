import { api } from '@/lib/api';
import { ZonesResponse, Zone } from '@/types/api';
import { syncZone } from './sync';

// In-memory cache for zone data
interface ZoneCache {
  activeZones?: {
    data: ZonesResponse;
    timestamp: number;
    expiresIn: number; // milliseconds
  }
}

const cache: ZoneCache = {};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

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
  // Check if we can use cached data for active zones
  if (
    options?.useCache !== false &&
    options?.status === 'active' && 
    options?.limit === 1 && 
    options?.sort === 'created_at' && 
    options?.order === 'desc' &&
    cache.activeZones &&
    Date.now() - cache.activeZones.timestamp < cache.activeZones.expiresIn
  ) {
    return cache.activeZones.data;
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  
  if (options?.status) {
    queryParams.append('status', options.status);
  }
  
  if (options?.limit) {
    queryParams.append('limit', options.limit.toString());
  }
  
  if (options?.offset) {
    queryParams.append('offset', options.offset.toString());
  }
  
  if (options?.sort) {
    // Handle timestamp-added sort parameters by extracting the base sort field
    // Safely handle 'created_at' with timestamp appended
    let sortField = options.sort;
    
    // If the sort parameter has a timestamp appended (for cache busting)
    if (sortField.startsWith('created_at_')) {
      sortField = 'created_at';
    }
    
    queryParams.append('sort', sortField);
  }
  
  if (options?.order) {
    queryParams.append('order', options.order);
  }
  
  // Add timestamp for cache busting if provided
  if (options?._t) {
    queryParams.append('_t', options._t);
  }
  
  const endpoint = `/api/zones${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await api.get<ZonesResponse>(endpoint);

  // Cache active zones data
  if (
    options?.status === 'active' && 
    options?.limit === 1 && 
    options?.sort === 'created_at' && 
    options?.order === 'desc'
  ) {
    cache.activeZones = {
      data: response,
      timestamp: Date.now(),
      expiresIn: CACHE_DURATION
    };
  }

  return response;
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
  Object.keys(cache).forEach(key => {
    delete cache[key as keyof ZoneCache];
  });
  
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
    Object.keys(cache).forEach(key => {
      delete cache[key as keyof ZoneCache];
    });
    
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