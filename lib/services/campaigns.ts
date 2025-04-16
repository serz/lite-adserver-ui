import { api } from '@/lib/api';
import { CampaignsResponse } from '@/types/api';

// In-memory cache for campaign data
interface CampaignCache {
  activeCampaigns?: {
    data: CampaignsResponse;
    timestamp: number;
    expiresIn: number; // milliseconds
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
    queryParams.append('sort', options.sort);
  }
  
  if (options?.order) {
    queryParams.append('order', options.order);
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