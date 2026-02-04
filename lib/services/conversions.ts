import { api } from '@/lib/api';
import { ConversionsResponse } from '@/types/api';

/**
 * Fetch conversions with optional pagination and sort options
 */
export async function getConversions(options?: {
  limit?: number;
  offset?: number;
  sort?: 'ad_event_id' | 'click_id' | 'created_at';
  order?: 'asc' | 'desc';
}): Promise<ConversionsResponse> {
  const queryParams = new URLSearchParams();

  if (options?.limit !== undefined) {
    queryParams.append('limit', options.limit.toString());
  }
  if (options?.offset !== undefined) {
    queryParams.append('offset', options.offset.toString());
  }
  if (options?.sort) {
    queryParams.append('sort', options.sort);
  }
  if (options?.order) {
    queryParams.append('order', options.order);
  }

  const query = queryParams.toString();
  const endpoint = query ? `/api/conversions?${query}` : '/api/conversions';
  return api.get<ConversionsResponse>(endpoint);
}
