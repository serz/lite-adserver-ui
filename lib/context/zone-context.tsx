'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  const { isAuthenticated, apiInitialized } = useAuth();

  const fetchZoneData = useCallback(async () => {
    if (!isAuthenticated || !apiInitialized) return;
    
    setIsLoading(true);
    try {
      // Fetch active zones count (uses cached data if available)
      const count = await getActiveZonesCount();
      setActiveZonesCount(count);
      
      // Fetch recent active zones
      const activeZonesResponse = await getActiveZones(3);
      setRecentActiveZones(activeZonesResponse.zones);
      
      setError(null);
    } catch (err) {
      setError('Failed to load zone data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && apiInitialized) {
      fetchZoneData();
    }
  }, [fetchZoneData, isAuthenticated, apiInitialized]);

  const refetchZones = useCallback(async () => {
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