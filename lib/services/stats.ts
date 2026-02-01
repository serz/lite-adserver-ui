import { api } from '@/lib/api';
import { StatsResponse } from '@/types/api';
import {
  getTimezone,
  getUtcMsForStartOfDayInTimezone,
  getUtcMsForEndOfDayInTimezone,
} from '@/lib/timezone';

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
 * Get current calendar date (y, m, d) in the given timezone.
 */
function getCalendarDateInTimezone(instant: Date, timeZone: string): { y: number; m: number; d: number } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(instant);
  const get = (name: string) =>
    parseInt(parts.find((p) => p.type === name)?.value ?? '0', 10);
  return {
    y: get('year'),
    m: get('month') - 1,
    d: get('day'),
  };
}

/**
 * Generate default date range for statistics (yesterday 00:00 to today 23:59:59 in profile timezone, as UTC).
 * @param timeZone Profile timezone (e.g. Europe/Riga). Defaults to getTimezone().
 */
export function getDefaultDateRange(timeZone?: string): { from: Date; to: Date } {
  const tz = timeZone ?? getTimezone();
  const now = new Date();
  const today = getCalendarDateInTimezone(now, tz);
  const yesterdayDate = new Date(today.y, today.m, today.d - 1);

  const fromMs = getUtcMsForStartOfDayInTimezone(
    yesterdayDate.getFullYear(),
    yesterdayDate.getMonth(),
    yesterdayDate.getDate(),
    tz
  );
  const toMs = getUtcMsForEndOfDayInTimezone(today.y, today.m, today.d, tz);

  return {
    from: new Date(fromMs),
    to: new Date(toMs),
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
 * Get stats for a specific date range with additional filtering options.
 * from = selected "from" day at 00:00:00 in profile timezone (converted to UTC).
 * to = selected "to" day at 23:59:59 in profile timezone (converted to UTC).
 */
export async function getStatsForPeriod(options: {
  from?: Date;
  to?: Date;
  timeZone?: string;
  campaignIds?: number[];
  zoneIds?: number[];
  groupBy?: 'date' | 'campaign_id' | 'zone_id' | 'country' | 'sub_id';
  useCache?: boolean;
}): Promise<StatsResponse> {
  const tz = options.timeZone ?? getTimezone();
  const defaultRange = getDefaultDateRange(tz);
  const fromDate = options.from ?? defaultRange.from;
  const toDate = options.to ?? defaultRange.to;

  const fromMs = getUtcMsForStartOfDayInTimezone(
    fromDate.getFullYear(),
    fromDate.getMonth(),
    fromDate.getDate(),
    tz
  );
  const toMs = getUtcMsForEndOfDayInTimezone(
    toDate.getFullYear(),
    toDate.getMonth(),
    toDate.getDate(),
    tz
  );

  return getStats({
    from: fromMs,
    to: toMs,
    campaignIds: options.campaignIds,
    zoneIds: options.zoneIds,
    groupBy: options.groupBy,
    useCache: options.useCache !== false,
  });
}

/**
 * Get stats for the last 7 days (from 7 days ago 00:00 in profile timezone, to now).
 */
export async function getLast7DaysStats(): Promise<StatsResponse> {
  const tz = getTimezone();
  const now = new Date();
  const today = getCalendarDateInTimezone(now, tz);
  const sevenDaysAgo = new Date(today.y, today.m, today.d - 7);

  const fromMs = getUtcMsForStartOfDayInTimezone(
    sevenDaysAgo.getFullYear(),
    sevenDaysAgo.getMonth(),
    sevenDaysAgo.getDate(),
    tz
  );

  return getStats({
    from: fromMs,
    useCache: true,
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