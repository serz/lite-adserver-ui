'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getCampaigns, getActiveCampaignsCount } from '@/lib/services/campaigns';
import { Campaign } from '@/types/api';
import { useAuth } from '@/components/auth-provider';
import { usePaginatedList, UsePaginatedListReturn } from '@/lib/hooks/use-paginated-list';

interface CampaignContextData {
  // Legacy: for sidebar/dashboard
  activeCampaignsCount: number | null;
  recentActiveCampaigns: Campaign[];
  
  // New: for list page
  listData: UsePaginatedListReturn<Campaign> | null;
  
  // Shared state
  isLoading: boolean;
  error: string | null;
  refetchCampaigns: () => Promise<void>;
}

const CampaignContext = createContext<CampaignContextData>({
  activeCampaignsCount: null,
  recentActiveCampaigns: [],
  listData: null,
  isLoading: false,
  error: null,
  refetchCampaigns: async () => {},
});

export const useCampaigns = () => useContext(CampaignContext);

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [activeCampaignsCount, setActiveCampaignsCount] = useState<number | null>(null);
  const [recentActiveCampaigns, setRecentActiveCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, apiInitialized, isAuthReady, userIdentity } = useAuth();
  const role = userIdentity?.role ?? null;
  const dataFetchedRef = useRef(false);
  const networkErrorRef = useRef(false);

  // Initialize the paginated list for campaigns (used by the list page)
  const listData = usePaginatedList<Campaign>({
    fetchFn: async (options) => {
      const response = await getCampaigns(options as Parameters<typeof getCampaigns>[0]);
      return {
        items: response.campaigns,
        pagination: response.pagination,
      };
    },
    itemsPerPage: 20,
    defaultSort: 'created_at',
    defaultOrder: 'desc',
    autoFetch: false, // Don't auto-fetch; let the page control when to fetch
  });

  const fetchCampaignData = useCallback(async () => {
    if (!isAuthReady || !isAuthenticated || !apiInitialized) {
      console.log('Campaign context: Auth not ready, not authenticated, or API not initialized');
      return;
    }
    
    if (dataFetchedRef.current) {
      console.log('Campaign context: Data already fetched, skipping');
      return;
    }

    if (networkErrorRef.current) {
      console.log('Campaign context: Skipping fetch due to previous network error');
      return;
    }

    if (role === 'publisher') {
      dataFetchedRef.current = true;
      setIsLoading(false);
      return;
    }
    
    console.log('Campaign context: Fetching campaign data...');
    setIsLoading(true);
    try {
      const count = await getActiveCampaignsCount();
      console.log('Campaign context: Received campaign count:', count);
      setActiveCampaignsCount(count);
      
      // Get recent campaigns
      const activeCampaignsResponse = await getCampaigns({
        status: 'active',
        limit: 3,
        sort: 'created_at',
        order: 'desc',
        useCache: true,
      });
      console.log('Campaign context: Received recent campaigns:', activeCampaignsResponse.campaigns);
      setRecentActiveCampaigns(activeCampaignsResponse.campaigns);
      
      setError(null);
      dataFetchedRef.current = true;
      networkErrorRef.current = false;
    } catch (err) {
      console.error('Campaign context: Error fetching campaign data:', err);
      let errorMessage = 'Failed to load campaign data';
      
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
          console.log('Campaign context: Network error detected, stopping retries');
          networkErrorRef.current = true;
          dataFetchedRef.current = true;
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthReady, isAuthenticated, apiInitialized, role]);

  useEffect(() => {
    if (isAuthReady && isAuthenticated && apiInitialized) {
      fetchCampaignData();
    }
  }, [fetchCampaignData, isAuthReady, isAuthenticated, apiInitialized]);

  // Clear in-memory state on logout so next login cannot reuse previous account data.
  // Only depend on auth state; listData is omitted to avoid infinite loop (it changes every render).
  useEffect(() => {
    if (!isAuthReady) return;
    if (isAuthenticated && apiInitialized) return;

    dataFetchedRef.current = false;
    networkErrorRef.current = false;
    setActiveCampaignsCount(null);
    setRecentActiveCampaigns([]);
    setError(null);
    setIsLoading(false);
    listData.setItems([]);
    listData.setPage(1);
  }, [isAuthReady, isAuthenticated, apiInitialized]);

  const refetchCampaigns = useCallback(async () => {
    dataFetchedRef.current = false;
    networkErrorRef.current = false;
    await fetchCampaignData();
    // Also refresh the list data
    await listData.refresh();
  }, [fetchCampaignData, listData]);

  return (
    <CampaignContext.Provider
      value={{
        activeCampaignsCount,
        recentActiveCampaigns,
        listData,
        isLoading,
        error,
        refetchCampaigns,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
} 
