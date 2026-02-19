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

import { createCacheManager, DEFAULT_CACHE_DURATION } from './cache';

// In-memory cache for stats data (keyed by full request params so groupBy/filters changes refetch)
const statsCacheManager = createCacheManager<StatsResponse>();

/**
 * Invalidate cached stats responses.
 * Use on logout/account switch to prevent cross-account stale data.
 */
export function invalidateStatsCache(): void {
  statsCacheManager.invalidate();
}

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
 * Generate default date range for statistics (yesterday 00:00 to today 00:00 in profile timezone).
 * "to" is start of today so the date picker shows the correct calendar day without flipping.
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
  const toMs = getUtcMsForStartOfDayInTimezone(today.y, today.m, today.d, tz);

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
  // Generate cache key for the request (includes from, to, campaignIds, zoneIds, groupBy)
  const cacheKey = generateCacheKey(options);

  // Check cache (same key required so changing groupBy/filters triggers a new request)
  if (options.useCache !== false) {
    const cached = statsCacheManager.get(cacheKey);
    if (cached !== null) {
      return cached;
    }
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

    // Cache the response with generated key
    statsCacheManager.set(cacheKey, response, DEFAULT_CACHE_DURATION);

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
 * Dates are interpreted as calendar days in profile timezone: from = 00:00:00, to = 23:59:59.
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

  const fromCal = getCalendarDateInTimezone(fromDate, tz);
  const toCal = getCalendarDateInTimezone(toDate, tz);

  const fromMs = getUtcMsForStartOfDayInTimezone(fromCal.y, fromCal.m, fromCal.d, tz);
  const toMs = getUtcMsForEndOfDayInTimezone(toCal.y, toCal.m, toCal.d, tz);

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
 * Get total conversions for the last 7 days
 */
export async function getLast7DaysConversions(): Promise<number> {
  try {
    const response = await getLast7DaysStats();
    return response.stats.reduce((total, stat) => total + stat.conversions, 0);
  } catch (error) {
    return 0;
  }
}

/**
 * Get impressions, clicks and conversions for the last 7 days in a single API call.
 */
export async function getLast7DaysMetrics(): Promise<{
  impressions: number;
  clicks: number;
  conversions: number;
}> {
  const response = await getLast7DaysStats();
  return {
    impressions: response.stats.reduce((total, stat) => total + stat.impressions, 0),
    clicks: response.stats.reduce((total, stat) => total + stat.clicks, 0),
    conversions: response.stats.reduce((total, stat) => total + stat.conversions, 0),
  };
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
