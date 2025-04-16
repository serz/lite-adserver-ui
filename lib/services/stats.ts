import { api } from '@/lib/api';
import { StatsResponse } from '@/types/api';
import { getTimezone } from '@/lib/timezone';

// In-memory cache for stats data
interface StatsCache {
  last7DaysStats?: {
    data: StatsResponse;
    timestamp: number;
    expiresIn: number; // milliseconds
  }
}

const cache: StatsCache = {};

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Get stats for a specific time period
 */
export async function getStats(options: {
  from: number;
  to?: number;
  useCache?: boolean;
}): Promise<StatsResponse> {
  // Check if we're requesting last 7 days stats and have cached data
  const now = Date.now();
  const isLast7DaysRequest = isLast7DaysRange(options.from, options.to || now);
  
  if (
    options.useCache !== false &&
    isLast7DaysRequest &&
    cache.last7DaysStats &&
    Date.now() - cache.last7DaysStats.timestamp < cache.last7DaysStats.expiresIn
  ) {
    return cache.last7DaysStats.data;
  }

  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.append('from', Math.floor(options.from / 1000).toString());
  
  if (options.to) {
    queryParams.append('to', Math.floor(options.to / 1000).toString());
  }
  
  const endpoint = `/api/stats?${queryParams.toString()}`;
  const response = await api.get<StatsResponse>(endpoint);

  // Cache last 7 days stats
  if (isLast7DaysRequest) {
    cache.last7DaysStats = {
      data: response,
      timestamp: Date.now(),
      expiresIn: CACHE_DURATION
    };
  }

  return response;
}

/**
 * Helper to check if the date range represents the last 7 days
 */
function isLast7DaysRange(from: number, to: number): boolean {
  const daysDiff = Math.round((to - from) / (1000 * 60 * 60 * 24));
  return daysDiff >= 6 && daysDiff <= 8; // Allow some flexibility for time of day
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