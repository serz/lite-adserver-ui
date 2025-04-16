"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { getCampaigns } from '@/lib/services/campaigns';
import { Campaign } from '@/types/api';
import { useAuth } from '@/components/auth-provider';
import { Badge } from '@/components/ui/badge';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, apiInitialized } = useAuth();

  useEffect(() => {
    const fetchCampaigns = async () => {
      // Only fetch data if authenticated and API is initialized
      if (!isAuthenticated || !apiInitialized) return;
      
      setIsLoading(true);
      try {
        const response = await getCampaigns({ limit: 20 });
        setCampaigns(response.campaigns);
        setError(null);
      } catch (err) {
        setError('Failed to load campaigns');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaigns();
  }, [isAuthenticated, apiInitialized]);

  // Format date to readable format
  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            New Campaign
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-destructive/15 p-4 text-destructive">
            {error}
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
                      <Badge variant={campaign.status as any}>
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(campaign.start_date)}</td>
                    <td className="px-4 py-3 text-sm">{campaign.end_date ? formatDate(campaign.end_date) : 'N/A'}</td>
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