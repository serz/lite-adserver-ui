"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getStatsForPeriod, getDefaultDateRange } from '@/lib/services/stats';
import { StatsResponse } from '@/types/api';
import { useAuth } from '@/components/auth-provider';
import { useTenantSettings } from '@/lib/use-tenant-settings';

interface StatsPageContextType {
  stats: StatsResponse | null;
  isLoading: boolean;
  error: string | null;
  dateRange: {
    from: Date;
    to: Date;
  };
  setDateRange: (range: { from: Date; to: Date }) => void;
  campaignIds: number[];
  setCampaignIds: (ids: number[]) => void;
  zoneIds: number[];
  setZoneIds: (ids: number[]) => void;
  groupBy: 'date' | 'campaign_id' | 'zone_id' | 'country' | 'sub_id';
  setGroupBy: (groupBy: 'date' | 'campaign_id' | 'zone_id' | 'country' | 'sub_id') => void;
  refetch: (useCache?: boolean) => Promise<void>;
  retryAfterNetworkError: () => void;
}

const StatsPageContext = createContext<StatsPageContextType | undefined>(undefined);

export function StatsPageProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, apiInitialized, isAuthReady } = useAuth();
  const { timezone: profileTimezone } = useTenantSettings();
  const tz = profileTimezone ?? 'UTC';
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() =>
    getDefaultDateRange('UTC')
  );
  const hasAppliedTimezoneDefaultRef = useRef(false);

  // When profile timezone loads, set default range once so "yesterday/today" is in platform time
  useEffect(() => {
    if (profileTimezone && !hasAppliedTimezoneDefaultRef.current) {
      hasAppliedTimezoneDefaultRef.current = true;
      setDateRange(getDefaultDateRange(profileTimezone));
    }
  }, [profileTimezone]);
  const [campaignIds, setCampaignIds] = useState<number[]>([]);
  const [zoneIds, setZoneIds] = useState<number[]>([]);
  const [groupBy, setGroupBy] = useState<'date' | 'campaign_id' | 'zone_id' | 'country' | 'sub_id'>('date');
  // Add a ref to track if we've already attempted to fetch data
  const dataFetchAttemptedRef = useRef(false);
  const networkErrorRef = useRef(false);
  
  const fetchStats = useCallback(async (useCache: boolean = true) => {
    // Only fetch if auth is ready and user is authenticated
    if (!isAuthReady) {
      console.log('Stats page context: Auth not ready yet');
      return;
    }
    
    if (!isAuthenticated || !apiInitialized) {
      setError('Authentication required. Please ensure you are logged in.');
      setIsLoading(false);
      return;
    }

    // Don't retry if we've encountered a network error
    if (networkErrorRef.current) {
      console.log('Stats page context: Skipping fetch due to previous network error');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Stats page context: Fetching stats data...');
      const response = await getStatsForPeriod({
        from: dateRange.from,
        to: dateRange.to,
        timeZone: tz,
        campaignIds: campaignIds.length > 0 ? campaignIds : undefined,
        zoneIds: zoneIds.length > 0 ? zoneIds : undefined,
        groupBy: groupBy,
        useCache: useCache,
      });
      
      setStats(response);
      dataFetchAttemptedRef.current = true;
      // Reset network error flag on successful fetch
      networkErrorRef.current = false;
    } catch (err) {
      console.error('Stats page context: Error fetching stats:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load stats';
      setError(errorMessage);
      
      // Mark as attempted and set network error flag for certain types of errors
      if (err instanceof Error) {
        if (err.message.includes('Authentication required') || err.message.includes('API key is required')) {
          dataFetchAttemptedRef.current = true;
        } else if (err.message.includes('Network error:') || 
                   err.message.includes('ERR_NAME_NOT_RESOLVED') || 
                   err.message.includes('NetworkError') || 
                   err.message.includes('Failed to fetch') ||
                   err.message.includes('net::ERR_') ||
                   err.message.includes('ERR_NETWORK')) {
          // Network-related errors - stop retrying
          console.log('Stats page context: Network error detected, stopping retries');
          networkErrorRef.current = true;
          dataFetchAttemptedRef.current = true;
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthReady, isAuthenticated, apiInitialized, dateRange, campaignIds, zoneIds, groupBy, tz]);

  // Update the date range and trigger a refetch
  const handleDateRangeUpdate = useCallback((range: { from: Date; to: Date }) => {
    setDateRange(range);
  }, []);

  // Manual retry function that resets network error flag
  const retryAfterNetworkError = useCallback(() => {
    console.log('Stats page context: Manually retrying after network error');
    networkErrorRef.current = false;
    dataFetchAttemptedRef.current = false;
    fetchStats();
  }, [fetchStats]);

  // Fetch stats when auth is ready and initialized
  useEffect(() => {
    // Only try to fetch if auth is ready
    if (!isAuthReady) {
      return;
    }
    
    // If authenticated and API initialized, fetch data
    if (isAuthenticated && apiInitialized) {
      // Only fetch if we haven't attempted before or if the filter criteria have changed
      if (!dataFetchAttemptedRef.current && !networkErrorRef.current) {
        console.log('Stats page context: Initial data fetch');
        fetchStats();
      }
    }
  }, [fetchStats, isAuthReady, isAuthenticated, apiInitialized]);

  // Fetch stats when filter criteria change (but only if we're authenticated)
  useEffect(() => {
    if (isAuthReady && isAuthenticated && apiInitialized) {
      if (dataFetchAttemptedRef.current && !networkErrorRef.current) {
        console.log('Stats page context: Refetching due to filter change');
        fetchStats();
      }
    }
  }, [isAuthReady, isAuthenticated, apiInitialized, fetchStats, dateRange, campaignIds, zoneIds, groupBy]);

  return (
    <StatsPageContext.Provider
      value={{
        stats,
        isLoading,
        error,
        dateRange,
        setDateRange: handleDateRangeUpdate,
        campaignIds,
        setCampaignIds,
        zoneIds,
        setZoneIds,
        groupBy,
        setGroupBy,
        refetch: fetchStats,
        retryAfterNetworkError
      }}
    >
      {children}
    </StatsPageContext.Provider>
  );
}

export function useStatsPage() {
  const context = useContext(StatsPageContext);
  if (context === undefined) {
    throw new Error('useStatsPage must be used within a StatsPageProvider');
  }
  return context;
} 