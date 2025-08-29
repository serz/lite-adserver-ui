'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getActiveZones, getActiveZonesCount } from '@/lib/services/zones';
import { Zone } from '@/types/api';
import { useAuth } from '@/components/auth-provider';

interface ZoneContextData {
  activeZonesCount: number | null;
  recentActiveZones: Zone[];
  isLoading: boolean;
  error: string | null;
  refetchZones: () => Promise<void>;
}

const ZoneContext = createContext<ZoneContextData>({
  activeZonesCount: null,
  recentActiveZones: [],
  isLoading: false,
  error: null,
  refetchZones: async () => {},
});

export const useZones = () => useContext(ZoneContext);

export function ZoneProvider({ children }: { children: React.ReactNode }) {
  const [activeZonesCount, setActiveZonesCount] = useState<number | null>(null);
  const [recentActiveZones, setRecentActiveZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, apiInitialized, isAuthReady } = useAuth();
  // Use a ref to track if we've already fetched data to prevent duplicate fetches
  const dataFetchedRef = useRef(false);
  const networkErrorRef = useRef(false);

  const fetchZoneData = useCallback(async () => {
    // Don't continue if auth isn't ready or user isn't authenticated
    if (!isAuthReady || !isAuthenticated || !apiInitialized) {
      console.log('Zone context: Auth not ready or not authenticated');
      return;
    }
    
    // If we've already fetched data, don't fetch again
    if (dataFetchedRef.current) {
      console.log('Zone context: Data already fetched, skipping');
      return;
    }

    // Don't retry if we've encountered a network error
    if (networkErrorRef.current) {
      console.log('Zone context: Skipping fetch due to previous network error');
      return;
    }
    
    console.log('Zone context: Fetching zone data...');
    setIsLoading(true);
    try {
      // Fetch active zones count (uses cached data if available)
      const count = await getActiveZonesCount();
      console.log('Zone context: Received zone count:', count);
      setActiveZonesCount(count);
      
      // Fetch recent active zones
      const activeZonesResponse = await getActiveZones(3);
      console.log('Zone context: Received recent zones:', activeZonesResponse.zones);
      setRecentActiveZones(activeZonesResponse.zones);
      
      setError(null);
      // Mark that we've successfully fetched data
      dataFetchedRef.current = true;
      // Reset network error flag on successful fetch
      networkErrorRef.current = false;
    } catch (err) {
      console.error('Zone context: Error fetching zone data:', err);
      let errorMessage = 'Failed to load zone data';
      
      // Handle network errors
      if (err instanceof Error) {
        if (err.message.includes('Authentication required') || err.message.includes('API key is required')) {
          dataFetchedRef.current = true;
          errorMessage = err.message;
        } else if (err.message.includes('Network error:') || 
                   err.message.includes('ERR_NAME_NOT_RESOLVED') || 
                   err.message.includes('NetworkError') || 
                   err.message.includes('Failed to fetch') ||
                   err.message.includes('net::ERR_') ||
                   err.message.includes('ERR_NETWORK')) {
          // Network-related errors - stop retrying
          console.log('Zone context: Network error detected, stopping retries');
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
    console.log('Zone context: useEffect triggered', { isAuthReady, isAuthenticated, apiInitialized });
    
    // Only fetch if auth is ready and we're authenticated
    if (isAuthReady && isAuthenticated && apiInitialized) {
      fetchZoneData();
    }
  }, [fetchZoneData, isAuthReady, isAuthenticated, apiInitialized]);

  const refetchZones = useCallback(async () => {
    // Reset the fetched flag to force a new fetch
    dataFetchedRef.current = false;
    networkErrorRef.current = false;
    await fetchZoneData();
  }, [fetchZoneData]);

  return (
    <ZoneContext.Provider
      value={{
        activeZonesCount,
        recentActiveZones,
        isLoading,
        error,
        refetchZones,
      }}
    >
      {children}
    </ZoneContext.Provider>
  );
} 