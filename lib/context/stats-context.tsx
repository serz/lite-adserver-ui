"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getLast7DaysImpressions, getLast7DaysClicks } from '@/lib/services/stats';
import { useAuth } from '@/components/auth-provider';

interface StatsContextType {
  impressions: number;
  clicks: number;
  isLoading: boolean;
  error: string | null;
  refetchStats: () => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [impressions, setImpressions] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, apiInitialized, isAuthReady } = useAuth();
  const dataFetchedRef = useRef(false);

  const fetchStats = useCallback(async () => {
    if (!isAuthReady || !isAuthenticated || !apiInitialized) {
      console.log('Stats context: Auth not ready, not authenticated, or API not initialized');
      return;
    }
    
    if (dataFetchedRef.current) {
      console.log('Stats context: Data already fetched, skipping');
      return;
    }
    
    console.log('Stats context: Fetching stats...');
    setIsLoading(true);
    try {
      const [impressionsData, clicksData] = await Promise.all([
        getLast7DaysImpressions(),
        getLast7DaysClicks()
      ]);
      
      console.log('Stats context: Received impressions:', impressionsData);
      console.log('Stats context: Received clicks:', clicksData);
      
      setImpressions(impressionsData);
      setClicks(clicksData);
      setError(null);
      dataFetchedRef.current = true;
    } catch (err) {
      console.error('Stats context: Error fetching stats:', err);
      setError('Failed to load statistics data');
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
    await fetchStats();
  }, [fetchStats]);

  return (
    <StatsContext.Provider
      value={{
        impressions,
        clicks,
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