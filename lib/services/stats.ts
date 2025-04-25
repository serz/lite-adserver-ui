import { api } from '@/lib/api';
import { StatsResponse } from '@/types/api';
import { getTimezone } from '@/lib/timezone';

interface SyncStateResponse {
  campaigns: {
    count: number;
  };
  zones: {
    count: number;
  };
  last_updated: string;
}

// In-memory cache for stats data
interface StatsCache {
  last7DaysStats?: {
    data: StatsResponse;
    timestamp: number;
    expiresIn: number; // milliseconds
  };
  cachedStats?: {
    key: string;
    data: StatsResponse;
    timestamp: number;
    expiresIn: number; // milliseconds
  };
}

const cache: StatsCache = {};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Generate default date range for statistics
 * @returns Object with from and to dates based on timezone
 */
export function getDefaultDateRange(): { from: Date, to: Date } {
  const timezone = getTimezone();
  const now = new Date();
  
  // Create date for yesterday at 00:00:00 in the current timezone
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  
  // Create date for today at 23:59:59 in the current timezone
  const today = new Date(now);
  today.setHours(23, 59, 59, 999);
  
  return {
    from: new Date(yesterday.toLocaleString('en-US', { timeZone: timezone })),
    to: new Date(today.toLocaleString('en-US', { timeZone: timezone }))
  };
}

/**
 * Get stats for a specific time period
 */
export async function getStats(options: {
  from: number;
  to?: number;
  useCache?: boolean;
  campaignIds?: number[];
  zoneIds?: number[];
  groupBy?: 'date' | 'campaign_id' | 'zone_id' | 'country' | 'sub_id';
}): Promise<StatsResponse> {
  const now = Date.now();
  const isLast7DaysRequest = isLast7DaysRange(options.from, options.to || now);
  
  // Generate cache key for the request
  const cacheKey = generateCacheKey(options);
  
  // Check if we're requesting last 7 days stats and have cached data
  if (
    options.useCache !== false &&
    isLast7DaysRequest &&
    cache.last7DaysStats &&
    Date.now() - cache.last7DaysStats.timestamp < cache.last7DaysStats.expiresIn
  ) {
    return cache.last7DaysStats.data;
  }
  
  // Check for other cached requests
  if (
    options.useCache !== false &&
    !isLast7DaysRequest &&
    cache.cachedStats &&
    cache.cachedStats.key === cacheKey &&
    Date.now() - cache.cachedStats.timestamp < cache.cachedStats.expiresIn
  ) {
    return cache.cachedStats.data;
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('from', options.from.toString());
  
  if (options.to) {
    queryParams.append('to', options.to.toString());
  }
  
  if (options.campaignIds && options.campaignIds.length > 0) {
    queryParams.append('campaign_ids', options.campaignIds.join(','));
  }
  
  if (options.zoneIds && options.zoneIds.length > 0) {
    queryParams.append('zone_ids', options.zoneIds.join(','));
  }
  
  if (options.groupBy) {
    queryParams.append('group_by', options.groupBy);
  }
  
  const endpoint = `/api/stats?${queryParams.toString()}`;
  
  try {
    const response = await api.get<StatsResponse>(endpoint);

    // Cache last 7 days stats
    if (isLast7DaysRequest) {
      cache.last7DaysStats = {
        data: response,
        timestamp: Date.now(),
        expiresIn: CACHE_DURATION
      };
    } else {
      // Cache other requests
      cache.cachedStats = {
        key: cacheKey,
        data: response,
        timestamp: Date.now(),
        expiresIn: CACHE_DURATION
      };
    }

    return response;
  } catch (error) {
    // Re-throw with more descriptive message
    if (error instanceof Error && error.message.includes('API key is required')) {
      throw new Error('Authentication required. Please ensure you are logged in and try again.');
    }
    throw error;
  }
}

/**
 * Generate a cache key for stats request
 */
function generateCacheKey(options: {
  from: number;
  to?: number;
  campaignIds?: number[];
  zoneIds?: number[];
  groupBy?: string;
}): string {
  return JSON.stringify({
    from: options.from,
    to: options.to,
    campaignIds: options.campaignIds?.sort(),
    zoneIds: options.zoneIds?.sort(),
    groupBy: options.groupBy
  });
}

/**
 * Helper to check if the date range represents the last 7 days
 */
function isLast7DaysRange(from: number, to: number): boolean {
  const daysDiff = Math.round((to - from) / (1000 * 60 * 60 * 24));
  return daysDiff >= 6 && daysDiff <= 8; // Allow some flexibility for time of day
}

/**
 * Get stats for a specific date range with additional filtering options
 */
export async function getStatsForPeriod(options: {
  from?: Date;
  to?: Date;
  campaignIds?: number[];
  zoneIds?: number[];
  groupBy?: 'date' | 'campaign_id' | 'zone_id' | 'country' | 'sub_id';
  useCache?: boolean;
}): Promise<StatsResponse> {
  // Use default date range if not provided
  const defaultRange = getDefaultDateRange();
  const fromDate = options.from || defaultRange.from;
  const toDate = options.to || defaultRange.to;

  return getStats({
    from: fromDate.getTime(),
    to: toDate.getTime(),
    campaignIds: options.campaignIds,
    zoneIds: options.zoneIds,
    groupBy: options.groupBy,
    useCache: options.useCache !== false
  });
}

/**
 * Get stats for the last 7 days, based on current timezone
 */
export async function getLast7DaysStats(): Promise<StatsResponse> {
  const timezone = getTimezone();
  const now = new Date();
  
  // Create date for 7 days ago at 00:00:00 in the current timezone
  const from = new Date(now);
  from.setDate(now.getDate() - 7);
  from.setHours(0, 0, 0, 0);
  
  // Convert to the selected timezone
  const fromInTimezone = new Date(from.toLocaleString('en-US', { timeZone: timezone }));
  
  return getStats({
    from: fromInTimezone.getTime(),
    useCache: true
  });
}

/**
 * Get total impressions for the last 7 days
 */
export async function getLast7DaysImpressions(): Promise<number> {
  try {
    const response = await getLast7DaysStats();
    return response.stats.reduce((total, stat) => total + stat.impressions, 0);
  } catch (error) {
    return 0;
  }
}

/**
 * Get total clicks for the last 7 days
 */
export async function getLast7DaysClicks(): Promise<number> {
  try {
    const response = await getLast7DaysStats();
    return response.stats.reduce((total, stat) => total + stat.clicks, 0);
  } catch (error) {
    return 0;
  }
}

/**
 * Get current system state (campaign/zone counts)
 */
export async function getSyncState(): Promise<SyncStateResponse> {
  const endpoint = '/api/sync/state';
  try {
    // Note: We might want caching here similar to getStats if this is called frequently
    const response = await api.get<SyncStateResponse>(endpoint);
    return response;
  } catch (error) {
    console.error('Failed to fetch sync state:', error);
    // Re-throw or return a default/error state
    if (error instanceof Error && error.message.includes('API key is required')) {
      throw new Error('Authentication required for sync state. Please ensure you are logged in.');
    }
    throw new Error('Failed to load system state.');
  }
} 