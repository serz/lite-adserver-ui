"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { getCampaigns, updateCampaign } from '@/lib/services/campaigns';
import { Campaign } from '@/types/api';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play, Pause, Edit } from 'lucide-react';
import { WithAuthGuard } from '@/components/with-auth-guard';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function CampaignsPage() {
  return (
    <DashboardLayout>
      <WithAuthGuard
        loadingComponent={
          <div className="container mx-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">Campaigns</h1>
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-md bg-muted"></div>
              ))}
            </div>
          </div>
        }
      >
        <CampaignsContent />
      </WithAuthGuard>
    </DashboardLayout>
  );
}

function CampaignsContent() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add a ref to track if we've already fetched data
  const hasInitiallyFetchedRef = useRef(false);
  // Add toast for notifications
  const { toast } = useToast();

  const fetchCampaigns = useCallback(async (forceFetch = false) => {
    // Only set loading state if we're doing an initial fetch or a forced refetch
    if (!hasInitiallyFetchedRef.current || forceFetch) {
      setIsLoading(true);
    }
    
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
      hasInitiallyFetchedRef.current = true;
    } catch (err) {
      setError('Failed to load campaigns. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Call fetchCampaigns only once when the component mounts
  useEffect(() => {
    if (!hasInitiallyFetchedRef.current) {
      console.log('CampaignsPage: Initial data fetch');
      fetchCampaigns();
    }
  }, [fetchCampaigns]);

  // Handle manual refresh with forced refetch
  const handleRefresh = async () => {
    await fetchCampaigns(true);
  };

  // Handle campaign status toggle
  const handleToggleStatus = async (campaign: Campaign) => {
    try {
      // Only toggle between active and paused (not completed)
      if (campaign.status === 'completed') {
        toast({
          title: "Cannot change status",
          description: "Completed campaigns cannot be reactivated.",
          variant: "destructive",
        });
        return;
      }
      
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';
      await updateCampaign(campaign.id, { status: newStatus });
      
      // Update local state
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(c => 
          c.id === campaign.id ? { ...c, status: newStatus } : c
        )
      );
      
      // Show success toast
      toast({
        title: "Success",
        description: `Campaign "${campaign.name}" has been ${newStatus === 'active' ? 'started' : 'paused'}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update campaign status. Please try again.",
        variant: "destructive",
      });
    }
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
        <Link href="/dashboard/campaigns/create">
          <Button className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            New Campaign
          </Button>
        </Link>
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
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
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
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant={campaign.status === 'active' ? 'ghost' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        title={campaign.status === 'active' ? 'Pause campaign' : 'Start campaign'}
                        onClick={() => handleToggleStatus(campaign)}
                        disabled={campaign.status === 'completed'}
                      >
                        {campaign.status === 'active' ? (
                          <Pause className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Play className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Link href={`/dashboard/campaigns/edit/${campaign.id}`}>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit campaign"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 