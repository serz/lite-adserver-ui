'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getActiveCampaigns, getActiveCampaignsCount } from '@/lib/services/campaigns';
import { Campaign } from '@/types/api';
import { useAuth } from '@/components/auth-provider';

interface CampaignContextData {
  activeCampaignsCount: number | null;
  recentActiveCampaigns: Campaign[];
  isLoading: boolean;
  error: string | null;
  refetchCampaigns: () => Promise<void>;
}

const CampaignContext = createContext<CampaignContextData>({
  activeCampaignsCount: null,
  recentActiveCampaigns: [],
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
  const { isAuthenticated, apiInitialized, isAuthReady } = useAuth();
  const dataFetchedRef = useRef(false);
  const networkErrorRef = useRef(false);

  const fetchCampaignData = useCallback(async () => {
    if (!isAuthReady || !isAuthenticated || !apiInitialized) {
      console.log('Campaign context: Auth not ready, not authenticated, or API not initialized');
      return;
    }
    
    if (dataFetchedRef.current) {
      console.log('Campaign context: Data already fetched, skipping');
      return;
    }

    // Don't retry if we've encountered a network error
    if (networkErrorRef.current) {
      console.log('Campaign context: Skipping fetch due to previous network error');
      return;
    }
    
    console.log('Campaign context: Fetching campaign data...');
    setIsLoading(true);
    try {
      // Fetch active campaigns count (uses cached data if available)
      const count = await getActiveCampaignsCount();
      console.log('Campaign context: Received campaign count:', count);
      setActiveCampaignsCount(count);
      
      // Fetch recent active campaigns
      const activeCampaignsResponse = await getActiveCampaigns(3);
      console.log('Campaign context: Received recent campaigns:', activeCampaignsResponse.campaigns);
      setRecentActiveCampaigns(activeCampaignsResponse.campaigns);
      
      setError(null);
      dataFetchedRef.current = true;
      // Reset network error flag on successful fetch
      networkErrorRef.current = false;
    } catch (err) {
      console.error('Campaign context: Error fetching campaign data:', err);
      let errorMessage = 'Failed to load campaign data';
      
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
  }, [isAuthReady, isAuthenticated, apiInitialized]);

  useEffect(() => {
    if (isAuthReady && isAuthenticated && apiInitialized) {
      fetchCampaignData();
    }
  }, [fetchCampaignData, isAuthReady, isAuthenticated, apiInitialized]);

  const refetchCampaigns = useCallback(async () => {
    dataFetchedRef.current = false;
    networkErrorRef.current = false;
    await fetchCampaignData();
  }, [fetchCampaignData]);

  return (
    <CampaignContext.Provider
      value={{
        activeCampaignsCount,
        recentActiveCampaigns,
        isLoading,
        error,
        refetchCampaigns,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
} 