import { api } from '@/lib/api';
import { TargetingRuleTypesResponse } from '@/types/api';

// In-memory cache
let cachedTargetingRuleTypes: {
  data: TargetingRuleTypesResponse;
  timestamp: number;
} | null = null;

// Cache duration (10 minutes)
const CACHE_DURATION = 10 * 60 * 1000;

/**
 * Fetch all targeting rule types
 */
export async function getTargetingRuleTypes(
  options?: { useCache?: boolean; }
): Promise<TargetingRuleTypesResponse> {
  // Check if we can use cached data
  if (
    options?.useCache !== false &&
    cachedTargetingRuleTypes && 
    Date.now() - cachedTargetingRuleTypes.timestamp < CACHE_DURATION
  ) {
    return cachedTargetingRuleTypes.data;
  }

  // Fetch from API
  const response = await api.get<TargetingRuleTypesResponse>('/api/targeting-rule-types');
  
  // Cache the response
  cachedTargetingRuleTypes = {
    data: response,
    timestamp: Date.now()
  };
  
  return response;
} 