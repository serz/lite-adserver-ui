"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getLast7DaysImpressions, getLast7DaysClicks, getSyncState } from '@/lib/services/stats';
import { useAuth } from '@/components/auth-provider';

interface StatsContextType {
  impressions: number;
  clicks: number;
  campaignsCount: number;
  zonesCount: number;
  isLoading: boolean;
  error: string | null;
  refetchStats: () => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [impressions, setImpressions] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [zonesCount, setZonesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, apiInitialized, isAuthReady } = useAuth();
  const dataFetchedRef = useRef(false);
  const networkErrorRef = useRef(false);

  const fetchStats = useCallback(async () => {
    if (!isAuthReady || !isAuthenticated || !apiInitialized) {
      console.log('Stats context: Auth not ready, not authenticated, or API not initialized');
      return;
    }
    
    if (dataFetchedRef.current) {
      console.log('Stats context: Data already fetched, skipping');
      return;
    }

    // Don't retry if we've encountered a network error
    if (networkErrorRef.current) {
      console.log('Stats context: Skipping fetch due to previous network error');
      return;
    }
    
    console.log('Stats context: Fetching stats...');
    setIsLoading(true);
    setError(null);

    try {
      const [impressionsData, clicksData, syncState] = await Promise.all([
        getLast7DaysImpressions(),
        getLast7DaysClicks(),
        getSyncState()
      ]);
      
      console.log('Stats context: Received impressions:', impressionsData);
      console.log('Stats context: Received clicks:', clicksData);
      console.log('Stats context: Received sync state:', syncState);
      
      setImpressions(impressionsData);
      setClicks(clicksData);
      setCampaignsCount(syncState.campaigns.count);
      setZonesCount(syncState.zones.count);
      
      dataFetchedRef.current = true;
      // Reset network error flag on successful fetch
      networkErrorRef.current = false;
    } catch (err) {
      console.error('Stats context: Error fetching stats:', err);
      let errorMessage = 'Failed to load statistics data';
      if (err instanceof Error) {
        if (err.message.includes('system state')) {
          errorMessage = 'Failed to load system state.';
        } else if (err.message.includes('Authentication required') || err.message.includes('API key is required')) {
          errorMessage = err.message;
          dataFetchedRef.current = true;
        } else if (err.message.includes('Network error:') || 
                   err.message.includes('ERR_NAME_NOT_RESOLVED') || 
                   err.message.includes('NetworkError') || 
                   err.message.includes('Failed to fetch') ||
                   err.message.includes('net::ERR_') ||
                   err.message.includes('ERR_NETWORK')) {
          // Network-related errors - stop retrying
          console.log('Stats context: Network error detected, stopping retries');
          networkErrorRef.current = true;
          dataFetchedRef.current = true;
          errorMessage = err.message;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthReady, isAuthenticated, apiInitialized]);

  useEffect(() => {
    if (isAuthReady && isAuthenticated && apiInitialized) {
      fetchStats();
    }
  }, [fetchStats, isAuthReady, isAuthenticated, apiInitialized]);

  const refetchStats = useCallback(async () => {
    dataFetchedRef.current = false;
    networkErrorRef.current = false;
    await fetchStats();
  }, [fetchStats]);

  return (
    <StatsContext.Provider
      value={{
        impressions,
        clicks,
        campaignsCount,
        zonesCount,
        isLoading,
        error,
        refetchStats,
      }}
    >
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
} 