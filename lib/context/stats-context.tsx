"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getLast7DaysImpressions, getLast7DaysClicks } from '@/lib/services/stats';
import { useAuth } from '@/components/auth-provider';

interface StatsContextType {
  impressions: number;
  clicks: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const StatsContext = createContext<StatsContextType | undefined>(undefined);

export function StatsProvider({ children }: { children: React.ReactNode }) {
  const [impressions, setImpressions] = useState<number>(0);
  const [clicks, setClicks] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, apiInitialized } = useAuth();

  const fetchStats = useCallback(async () => {
    if (!isAuthenticated || !apiInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const [impressionsData, clicksData] = await Promise.all([
        getLast7DaysImpressions(),
        getLast7DaysClicks()
      ]);
      
      setImpressions(impressionsData);
      setClicks(clicksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch when auth is ready
  useEffect(() => {
    if (isAuthenticated && apiInitialized) {
      fetchStats();
    }
  }, [fetchStats, isAuthenticated, apiInitialized]);

  return (
    <StatsContext.Provider
      value={{
        impressions,
        clicks,
        isLoading,
        error,
        refetch: fetchStats
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