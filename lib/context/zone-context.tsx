'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getZones, getActiveZonesCount } from '@/lib/services/zones';
import { Zone } from '@/types/api';
import { useAuth } from '@/components/auth-provider';
import { usePaginatedList, UsePaginatedListReturn } from '@/lib/hooks/use-paginated-list';

interface ZoneContextData {
  // Legacy: for sidebar/dashboard
  activeZonesCount: number | null;
  recentActiveZones: Zone[];
  
  // New: for list page
  listData: UsePaginatedListReturn<Zone> | null;
  
  // Shared state
  isLoading: boolean;
  error: string | null;
  refetchZones: () => Promise<void>;
}

const ZoneContext = createContext<ZoneContextData>({
  activeZonesCount: null,
  recentActiveZones: [],
  listData: null,
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
  const dataFetchedRef = useRef(false);
  const networkErrorRef = useRef(false);

  // Initialize the paginated list for zones (used by the list page)
  const listData = usePaginatedList<Zone>({
    fetchFn: async (options) => {
      const response = await getZones(options as Parameters<typeof getZones>[0]);
      return {
        items: response.zones,
        pagination: response.pagination,
      };
    },
    itemsPerPage: 10,
    defaultSort: 'created_at',
    defaultOrder: 'desc',
    autoFetch: false, // Don't auto-fetch; let the page control when to fetch
  });

  const fetchZoneData = useCallback(async () => {
    if (!isAuthReady || !isAuthenticated || !apiInitialized) {
      console.log('Zone context: Auth not ready or not authenticated');
      return;
    }
    
    if (dataFetchedRef.current) {
      console.log('Zone context: Data already fetched, skipping');
      return;
    }

    if (networkErrorRef.current) {
      console.log('Zone context: Skipping fetch due to previous network error');
      return;
    }
    
    console.log('Zone context: Fetching zone data...');
    setIsLoading(true);
    try {
      const count = await getActiveZonesCount();
      console.log('Zone context: Received zone count:', count);
      setActiveZonesCount(count);
      
      // Get recent zones from the list data if available, otherwise fetch separately
      const activeZonesResponse = await getZones({
        status: 'active',
        limit: 3,
        sort: 'created_at',
        order: 'desc',
        useCache: true,
      });
      console.log('Zone context: Received recent zones:', activeZonesResponse.zones);
      setRecentActiveZones(activeZonesResponse.zones);
      
      setError(null);
      dataFetchedRef.current = true;
      networkErrorRef.current = false;
    } catch (err) {
      console.error('Zone context: Error fetching zone data:', err);
      let errorMessage = 'Failed to load zone data';
      
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
    
    if (isAuthReady && isAuthenticated && apiInitialized) {
      fetchZoneData();
    }
  }, [fetchZoneData, isAuthReady, isAuthenticated, apiInitialized]);

  const refetchZones = useCallback(async () => {
    dataFetchedRef.current = false;
    networkErrorRef.current = false;
    await fetchZoneData();
    // Also refresh the list data
    await listData.refresh();
  }, [fetchZoneData, listData]);

  return (
    <ZoneContext.Provider
      value={{
        activeZonesCount,
        recentActiveZones,
        listData,
        isLoading,
        error,
        refetchZones,
      }}
    >
      {children}
    </ZoneContext.Provider>
  );
} 