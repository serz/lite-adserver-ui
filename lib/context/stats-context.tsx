"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getLast7DaysMetrics, getSyncState } from '@/lib/services/stats';
import { useAuth } from '@/components/auth-provider';
import { useTenantSettings } from '@/lib/use-tenant-settings';
import { useUserIdentity } from '@/lib/use-user-identity';

interface StatsContextType {
  impressions: number;
  clicks: number;
  conversions: number;
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
  const [conversions, setConversions] = useState(0);
  const [campaignsCount, setCampaignsCount] = useState(0);
  const [zonesCount, setZonesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, apiInitialized, isAuthReady } = useAuth();
  const { isLoading: tenantSettingsLoading } = useTenantSettings();
  const { role } = useUserIdentity();
  const dataFetchedRef = useRef(false);
  const networkErrorRef = useRef(false);

  const fetchStats = useCallback(async () => {
    if (!isAuthReady || !isAuthenticated || !apiInitialized) {
      console.log('Stats context: Auth not ready, not authenticated, or API not initialized');
      return;
    }
    if (role == null) {
      console.log('Stats context: Role not yet loaded');
      return;
    }
    // Wait for tenant settings so getTimezone() is correct and "from" is 00:00 7 days ago in tenant TZ
    if (tenantSettingsLoading) {
      console.log('Stats context: Waiting for tenant settings (timezone)');
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
    
    const isOwnerOrManager = role === 'owner' || role === 'manager';
    console.log('Stats context: Fetching stats...');
    setIsLoading(true);
    setError(null);

    try {
      // GET /api/sync/state is only for owners/managers; backend does not filter by campaign/zone ownership
      const [metrics, syncState] = await Promise.all([
        getLast7DaysMetrics(),
        isOwnerOrManager ? getSyncState() : Promise.resolve({ campaigns: { count: 0 }, zones: { count: 0 } }),
      ]);
      
      console.log('Stats context: Received metrics:', metrics);
      if (isOwnerOrManager) {
        console.log('Stats context: Received sync state:', syncState);
      }
      
      setImpressions(metrics.impressions);
      setClicks(metrics.clicks);
      setConversions(metrics.conversions);
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
  }, [isAuthReady, isAuthenticated, apiInitialized, tenantSettingsLoading, role]);

  useEffect(() => {
    if (isAuthReady && isAuthenticated && apiInitialized && !tenantSettingsLoading && role != null) {
      fetchStats();
    }
  }, [fetchStats, isAuthReady, isAuthenticated, apiInitialized, tenantSettingsLoading, role]);

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
        conversions,
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