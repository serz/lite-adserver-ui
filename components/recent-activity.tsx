'use client';

import React from 'react';
import Link from 'next/link';
import { useCampaigns } from '@/lib/context/campaign-context';
import { useZones } from '@/lib/context/zone-context';
import { Campaign, Zone } from '@/types/api';
import { Layers, Users } from 'lucide-react';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/date-utils';

type ActivityItem = {
  id: number | string;
  name: string;
  type: 'campaign' | 'zone';
  created_at: number;
  status: string;
  url: string;
};

export function RecentActivity() {
  const { recentActiveCampaigns, isLoading: campaignsLoading, error: campaignsError } = useCampaigns();
  const { recentActiveZones, isLoading: zonesLoading, error: zonesError } = useZones();

  const isLoading = campaignsLoading || zonesLoading;
  const hasError = campaignsError || zonesError;

  // Format all recent activity items
  const activityItems: ActivityItem[] = [
    ...recentActiveCampaigns.map((campaign: Campaign) => ({
      id: campaign.id,
      name: campaign.name,
      type: 'campaign' as const,
      created_at: campaign.created_at,
      status: campaign.status,
      url: `/dashboard/campaigns/edit/${campaign.id}`,
    })),
    ...recentActiveZones.map((zone: Zone) => ({
      id: zone.id,
      name: zone.name,
      type: 'zone' as const, 
      created_at: zone.created_at,
      status: zone.status,
      url: `/dashboard/zones`,
    })),
  ].sort((a, b) => b.created_at - a.created_at).slice(0, 5);

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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
            <div className="flex-1">
              <div className="h-4 w-32 animate-pulse rounded bg-muted mb-2"></div>
              <div className="h-3 w-24 animate-pulse rounded bg-muted"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="p-4 text-center text-destructive bg-destructive/10 rounded-md">
        Failed to load recent activity
      </div>
    );
  }

  if (activityItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-10 px-6 text-center">
        <p className="text-muted-foreground mb-1">No recent activity yet.</p>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          Create your first campaign or add a zone to see activity here.
        </p>
        <Link href="/dashboard/campaigns/create">
          <Button className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-glow-primary transition-shadow">
            Create Campaign
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activityItems.map((item) => (
        <Link 
          href={item.url}
          key={`${item.type}-${item.id}`}
          className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent/50 transition-colors"
        >
          <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary`}>
            {item.type === 'campaign' ? (
              <Layers className="h-4 w-4" />
            ) : (
              <Users className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{item.name}</h4>
              <Badge 
                variant={getStatusVariant(item.status)} 
                size="sm" 
                radius="sm"
                highContrast={item.status === 'active'}
              >
                {item.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {item.type === 'campaign' ? 'Campaign' : 'Zone'} • Created {formatDate(item.created_at, { format: 'MMM dd, yyyy' })}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
} 