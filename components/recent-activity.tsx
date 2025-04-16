'use client';

import React from 'react';
import Link from 'next/link';
import { useCampaigns } from '@/lib/context/campaign-context';
import { useZones } from '@/lib/context/zone-context';
import { Campaign, Zone } from '@/types/api';
import { formatDate } from '@/lib/timezone';
import { Layers, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

type ActivityItem = {
  id: number;
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
      url: `/dashboard/campaigns/${campaign.id}`,
    })),
    ...recentActiveZones.map((zone: Zone) => ({
      id: zone.id,
      name: zone.name,
      type: 'zone' as const, 
      created_at: zone.created_at,
      status: zone.status,
      url: `/dashboard/zones/${zone.id}`,
    })),
  ].sort((a, b) => b.created_at - a.created_at).slice(0, 5);

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
    return <p className="text-muted-foreground">No recent activity to display</p>;
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
                variant={item.status as any} 
                size="sm" 
                radius="sm"
                highContrast={item.status === 'active'}
              >
                {item.status}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {item.type === 'campaign' ? 'Campaign' : 'Zone'} • Created {formatDate(item.created_at, { dateStyle: 'medium' })}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
} 