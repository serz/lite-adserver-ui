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
  status?: 'active' | 'paused';
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
  status?: 'active' | 'paused';
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