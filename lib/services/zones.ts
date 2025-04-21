import { api } from '@/lib/api';
import { ZonesResponse, Zone } from '@/types/api';

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
 * Create a new zone
 */
export async function createZone(zoneData: {
  name: string;
  site_url?: string;
  traffic_back_url?: string;
}): Promise<Zone> {
  try {
    const response = await api.post<{ zone: Zone }>('/api/zones', zoneData);
    
    // Invalidate all cache after creating a new zone
    Object.keys(cache).forEach(key => {
      delete cache[key as keyof ZoneCache];
    });
    
    return response.zone;
  } catch (error) {
    throw error;
  }
}

/**
 * Update an existing zone
 */
export async function updateZone(
  id: number,
  zoneData: {
    name?: string;
    site_url?: string;
    traffic_back_url?: string;
    status?: 'active' | 'inactive';
  }
): Promise<Zone> {
  try {
    const response = await api.put<{ zone: Zone }>(`/api/zones/${id}`, zoneData);
    
    // Invalidate all cache after updating a zone
    Object.keys(cache).forEach(key => {
      delete cache[key as keyof ZoneCache];
    });
    
    return response.zone;
  } catch (error) {
    throw error;
  }
}

/**
 * Get a specific zone by ID
 */
export async function getZone(id: number): Promise<Zone> {
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