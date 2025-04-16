import { api } from '@/lib/api';
import { CampaignsResponse } from '@/types/api';

/**
 * Fetch campaigns with optional filtering options
 */
export async function getCampaigns(options?: {
  status?: 'active' | 'paused' | 'completed';
  limit?: number;
  offset?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}): Promise<CampaignsResponse> {
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
  return await api.get<CampaignsResponse>(endpoint);
}

/**
 * Fetch active campaigns
 */
export async function getActiveCampaigns(limit: number = 10): Promise<CampaignsResponse> {
  return getCampaigns({
    status: 'active',
    limit,
    sort: 'created_at',
    order: 'desc'
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