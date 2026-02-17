import { api } from '@/lib/api';
import { CampaignsResponse, Campaign, TargetingRule, PayoutRule, PayoutRulesResponse } from '@/types/api';
import { createCacheManager, DEFAULT_CACHE_DURATION } from './cache';
import { createListService, activeResourceCacheKeyGenerator } from './list-service-factory';
import { stripTimestampSuffix } from './query-builder';

// Cache manager for campaign lists
const listCacheManager = createCacheManager<CampaignsResponse>();

// Cache manager for individual campaigns
const itemCacheManager = createCacheManager<Campaign>();

// Create the generic list service for campaigns
const campaignListService = createListService<CampaignsResponse, {
  status?: 'active' | 'paused' | 'completed';
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  useCache?: boolean;
  _t?: string;
}>({
  endpoint: '/api/campaigns',
  cacheKeyGenerator: activeResourceCacheKeyGenerator('Campaigns'),
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
  return campaignListService.fetch(options);
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
  payment_model?: 'cpm' | 'cpa';
  rate?: number | null;
}): Promise<Campaign> {
  try {
    const response = await api.post<Campaign>('/api/campaigns', campaignData);
    
    // Invalidate all cache after creating a new campaign
    listCacheManager.invalidate();
    itemCacheManager.invalidate();
    
    return response;
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
    payment_model?: 'cpm' | 'cpa';
    rate?: number | null;
  }
): Promise<Campaign> {
  try {
    const response = await api.put<Campaign>(`/api/campaigns/${id}`, campaignData);
    
    // Invalidate all cache after updating a campaign
    listCacheManager.invalidate();
    itemCacheManager.invalidate();
    
    return response;
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
  
  const cacheKey = `campaign_${id}`;
  
  // Check if we can use cached data
  if (options?.useCache !== false) {
    const cached = itemCacheManager.get(cacheKey);
    if (cached !== null) {
      console.log(`Using cached campaign data for ID: ${id}`);
      return cached;
    }
  }

  try {
    console.log(`Making API request to fetch campaign with ID: ${id}`);
    const response = await api.get<Campaign>(`/api/campaigns/${id}`);
    console.log(`Campaign API response received for ID: ${id}`, response);
    
    // Cache the response
    itemCacheManager.set(cacheKey, response, DEFAULT_CACHE_DURATION);
    
    return response;
  } catch (error) {
    console.error(`Error fetching campaign with ID: ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a campaign (only paused campaigns can be deleted)
 */
export async function deleteCampaign(id: number): Promise<void> {
  await api.delete(`/api/campaigns/${id}`);

  // Invalidate all cache after deleting a campaign
  listCacheManager.invalidate();
  itemCacheManager.invalidate();
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

/**
 * Replace targeting rules for a campaign.
 */
export async function updateCampaignTargetingRules(
  campaignId: number,
  targetingRules: TargetingRule[]
): Promise<void> {
  try {
    await api.post(`/api/campaigns/${campaignId}/targeting_rules`, targetingRules);
  } catch (error) {
    console.error(`Error updating targeting rules for campaign ${campaignId}:`, error);
    throw error;
  }
}

/**
 * Get payout rules for a campaign by ID
 */
export async function getCampaignPayoutRules(campaignId: number): Promise<PayoutRule[]> {
  try {
    const response = await api.get<PayoutRulesResponse>(`/api/campaigns/${campaignId}/payout_rules`);
    return response.payout_rules;
  } catch (error) {
    console.error(`Error fetching payout rules for campaign ${campaignId}:`, error);
    throw error;
  }
}

/**
 * Create a payout rule for a campaign
 */
export async function createPayoutRule(
  campaignId: number,
  payoutData: {
    payout: number;
    zone_id?: string | null;
  }
): Promise<PayoutRule> {
  try {
    const response = await api.post<PayoutRule>(`/api/campaigns/${campaignId}/payout_rules`, payoutData);
    return response;
  } catch (error) {
    console.error(`Error creating payout rule for campaign ${campaignId}:`, error);
    throw error;
  }
}

/**
 * Delete a payout rule for a campaign
 * @param campaignId - Campaign ID
 * @param zoneId - Zone UUID (optional, omit to delete global rule)
 */
export async function deletePayoutRule(
  campaignId: number,
  zoneId?: string | null
): Promise<void> {
  try {
    const endpoint = zoneId 
      ? `/api/campaigns/${campaignId}/payout_rules?zone_id=${zoneId}`
      : `/api/campaigns/${campaignId}/payout_rules`;
    await api.delete(endpoint);
  } catch (error) {
    console.error(`Error deleting payout rule for campaign ${campaignId}:`, error);
    throw error;
  }
}
