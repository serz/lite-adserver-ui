"use client";

import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { getCampaigns } from '@/lib/services/campaigns';
import { Campaign } from '@/types/api';
import { useAuth } from '@/components/auth-provider';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, apiInitialized } = useAuth();

  const fetchCampaigns = useCallback(async () => {
    // Only fetch data if authenticated and API is initialized
    if (!isAuthenticated || !apiInitialized) return;
    
    setIsLoading(true);
    
    try {
      // Always fetch fresh data, no caching
      const response = await getCampaigns({ 
        limit: 20, 
        useCache: false,
        sort: 'created_at',
        order: 'desc',
        // Add timestamp to query to prevent browser caching
        _t: Date.now().toString()
      });
      
      setCampaigns(response.campaigns);
      setError(null);
    } catch (err) {
      setError('Failed to load campaigns. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch when component mounts and auth is ready
  useEffect(() => {
    // Only run this effect when both auth conditions are met
    if (isAuthenticated && apiInitialized) {
      fetchCampaigns();
    }
  }, [fetchCampaigns, isAuthenticated, apiInitialized]);

  // Handle manual refresh
  const handleRefresh = async () => {
    await fetchCampaigns();
  };

  // Helper function to map status to variant
  const getStatusVariant = (status: string): BadgeProps['variant'] => {
    switch (status) {
      case 'active':
        return 'active';
      case 'paused':
        return 'paused';
      case 'completed':
        return 'completed';
      case 'inactive':
        return 'inactive';
      default:
        return 'default';
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold">Campaigns</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              title="Refresh campaigns"
            >
              <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            New Campaign
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-destructive/15 p-4 text-destructive">
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={handleRefresh}
            >
              Retry
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-md bg-muted"></div>
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-md border bg-card p-6 text-center">
            <p className="text-muted-foreground">No campaigns found</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border bg-card">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Start Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">End Date</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map(campaign => (
                  <tr key={campaign.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{campaign.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge 
                        variant={getStatusVariant(campaign.status)} 
                        highContrast={campaign.status === 'active'} 
                        radius="sm"
                      >
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(campaign.start_date)}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(campaign.end_date, { fallback: 'N/A' })}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(campaign.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 