'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getActiveCampaigns, getActiveCampaignsCount } from '@/lib/services/campaigns';
import { CampaignsResponse, Campaign } from '@/types/api';
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
  const { isAuthenticated, apiInitialized } = useAuth();

  const fetchCampaignData = useCallback(async () => {
    if (!isAuthenticated || !apiInitialized) return;
    
    setIsLoading(true);
    try {
      // Fetch active campaigns count (uses cached data if available)
      const count = await getActiveCampaignsCount();
      setActiveCampaignsCount(count);
      
      // Fetch recent active campaigns
      const activeCampaignsResponse = await getActiveCampaigns(3);
      setRecentActiveCampaigns(activeCampaignsResponse.campaigns);
      
      setError(null);
    } catch (err) {
      console.error('Failed to fetch campaign data:', err);
      setError('Failed to load campaign data');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, apiInitialized]);

  useEffect(() => {
    fetchCampaignData();
  }, [fetchCampaignData]);

  const refetchCampaigns = useCallback(async () => {
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