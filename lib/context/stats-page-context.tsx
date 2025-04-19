"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getStatsForPeriod, getDefaultDateRange } from '@/lib/services/stats';
import { StatsResponse } from '@/types/api';
import { useAuth } from '@/components/auth-provider';

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
}

const StatsPageContext = createContext<StatsPageContextType | undefined>(undefined);

export function StatsPageProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, apiInitialized } = useAuth();
  const defaultRange = getDefaultDateRange();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(defaultRange);
  const [campaignIds, setCampaignIds] = useState<number[]>([]);
  const [zoneIds, setZoneIds] = useState<number[]>([]);
  const [groupBy, setGroupBy] = useState<'date' | 'campaign_id' | 'zone_id' | 'country' | 'sub_id'>('date');
  
  const fetchStats = useCallback(async (useCache: boolean = true) => {
    if (!isAuthenticated || !apiInitialized) {
      setError('Authentication required. Please ensure you are logged in.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const response = await getStatsForPeriod({
        from: dateRange.from,
        to: dateRange.to,
        campaignIds: campaignIds.length > 0 ? campaignIds : undefined,
        zoneIds: zoneIds.length > 0 ? zoneIds : undefined,
        groupBy: groupBy,
        useCache: useCache
      });
      
      setStats(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update the date range and trigger a refetch
  const handleDateRangeUpdate = useCallback((range: { from: Date; to: Date }) => {
    setDateRange(range);
  }, []);

  // Fetch stats when auth is initialized
  useEffect(() => {
    if (isAuthenticated && apiInitialized) {
      fetchStats();
    }
  }, [fetchStats, isAuthenticated, apiInitialized]);

  // Fetch stats when filter criteria change
  useEffect(() => {
    if (isAuthenticated && apiInitialized) {
      fetchStats();
    }
  }, [dateRange, campaignIds, zoneIds, groupBy]);

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
        refetch: fetchStats
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