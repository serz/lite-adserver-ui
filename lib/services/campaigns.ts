import { api } from '@/lib/api';
import { CampaignsResponse, Campaign, TargetingRule } from '@/types/api';
import { syncCampaign } from './sync';

// In-memory cache for campaign data
interface CampaignCache {
  activeCampaigns?: {
    data: CampaignsResponse;
    timestamp: number;
    expiresIn: number; // milliseconds
  },
  campaignById?: {
    [id: number]: {
      data: Campaign;
      timestamp: number;
      expiresIn: number;
    }
  }
}

const cache: CampaignCache = {};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Fetch campaigns with optional filtering options
 */
export async function getCampaigns(options?: {
  status?: 'active' | 'paused' | 'completed';
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  useCache?: boolean;
  _t?: string; // Timestamp for cache busting
}): Promise<CampaignsResponse> {
  // Check if we can use cached data for active campaigns
  if (
    options?.useCache !== false &&
    options?.status === 'active' && 
    options?.limit === 1 && 
    options?.sort === 'created_at' && 
    options?.order === 'desc' &&
    cache.activeCampaigns &&
    Date.now() - cache.activeCampaigns.timestamp < cache.activeCampaigns.expiresIn
  ) {
    return cache.activeCampaigns.data;
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
  
  const endpoint = `/api/campaigns${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await api.get<CampaignsResponse>(endpoint);

  // Cache active campaigns data
  if (
    options?.status === 'active' && 
    options?.limit === 1 && 
    options?.sort === 'created_at' && 
    options?.order === 'desc'
  ) {
    cache.activeCampaigns = {
      data: response,
      timestamp: Date.now(),
      expiresIn: CACHE_DURATION
    };
  }

  return response;
}

/**
 * Fetch active campaigns
 */
export async function getActiveCampaigns(limit: number = 10): Promise<CampaignsResponse> {
  return getCampaigns({
    status: 'active',
    limit,
    sort: 'created_at',
    order: 'desc',
    useCache: true
  });
}

/**
 * Get the count of active campaigns
 */
export async function getActiveCampaignsCount(): Promise<number> {
  try {
    const response = await getActiveCampaigns(1);
    return response.pagination.total;
  } catch (error) {
    // Return 0 on error
    return 0;
  }
}

/**
 * Create a new campaign
 */
export async function createCampaign(campaignData: {
  name: string;
  redirect_url: string;
  start_date: number; // timestamp in milliseconds
  end_date?: number | null; // timestamp in milliseconds
  status?: 'active' | 'paused';
  targeting_rules?: TargetingRule[];
}): Promise<Campaign> {
  try {
    const response = await api.post<{ campaign: Campaign }>('/api/campaigns', campaignData);
    
    // Invalidate all cache after creating a new campaign
    Object.keys(cache).forEach(key => {
      delete cache[key as keyof CampaignCache];
    });
    
    return response.campaign;
  } catch (error) {
    throw error;
  }
}

/**
 * Update an existing campaign
 */
export async function updateCampaign(
  id: number,
  campaignData: {
    name?: string;
    redirect_url?: string;
    start_date?: number; // timestamp in milliseconds
    end_date?: number | null; // timestamp in milliseconds
    status?: 'active' | 'paused' | 'completed';
    targeting_rules?: TargetingRule[];
  }
): Promise<Campaign> {
  try {
    const response = await api.put<{ campaign: Campaign }>(`/api/campaigns/${id}`, campaignData);
    
    // Invalidate all cache after updating a campaign
    Object.keys(cache).forEach(key => {
      delete cache[key as keyof CampaignCache];
    });
    
    // If status is being changed, trigger sync to KV storage
    if (campaignData.status !== undefined) {
      try {
        await syncCampaign(id);
      } catch (syncError) {
        console.error(`Failed to sync campaign ${id} after status update:`, syncError);
        // Don't rethrow, as the campaign update was successful
      }
    }
    
    return response.campaign;
  } catch (error) {
    throw error;
  }
}

/**
 * Get a single campaign by ID
 */
export async function getCampaign(id: number, options?: {
  useCache?: boolean;
}): Promise<Campaign> {
  console.log(`getCampaign called for ID: ${id} with options:`, options);
  
  // Check if we can use cached data
  if (
    options?.useCache !== false &&
    cache.campaignById?.[id] &&
    Date.now() - cache.campaignById[id].timestamp < cache.campaignById[id].expiresIn
  ) {
    console.log(`Using cached campaign data for ID: ${id}`);
    return cache.campaignById[id].data;
  }

  try {
    console.log(`Making API request to fetch campaign with ID: ${id}`);
    const response = await api.get<Campaign>(`/api/campaigns/${id}`);
    console.log(`Campaign API response received for ID: ${id}`, response);
    
    // Cache the response
    if (!cache.campaignById) {
      cache.campaignById = {};
    }
    
    cache.campaignById[id] = {
      data: response,
      timestamp: Date.now(),
      expiresIn: CACHE_DURATION
    };
    
    return response;
  } catch (error) {
    console.error(`Error fetching campaign with ID: ${id}:`, error);
    throw error;
  }
}

/**
 * Get targeting rules for a campaign by ID
 */
export async function getCampaignTargetingRules(campaignId: number): Promise<TargetingRule[]> {
  try {
    const response = await api.get<{ targeting_rules: TargetingRule[] }>(`/api/campaigns/${campaignId}/targeting_rules`);
    return response.targeting_rules;
  } catch (error) {
    console.error(`Error fetching targeting rules for campaign ${campaignId}:`, error);
    throw error;
  }
} 