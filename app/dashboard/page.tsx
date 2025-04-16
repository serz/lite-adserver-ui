"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { useCampaigns } from '@/lib/context/campaign-context';
import { useZones } from '@/lib/context/zone-context';
import { useStats } from '@/lib/context/stats-context';

export default function DashboardPage() {
  const { activeCampaignsCount, isLoading: campaignsLoading, error: campaignsError } = useCampaigns();
  const { activeZonesCount, isLoading: zonesLoading, error: zonesError } = useZones();
  const { impressions, clicks, isLoading: statsLoading, error: statsError } = useStats();

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Campaign Stats Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Campaigns</h3>
            <div className="text-3xl font-bold">
              {campaignsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
              ) : campaignsError ? (
                <span className="text-destructive">!</span>
              ) : (
                activeCampaignsCount
              )}
            </div>
            <p className="text-sm text-muted-foreground">Active campaigns</p>
            {campaignsError && (
              <p className="mt-2 text-xs text-destructive">{campaignsError}</p>
            )}
          </div>
          
          {/* Zones Stats Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Zones</h3>
            <div className="text-3xl font-bold">
              {zonesLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
              ) : zonesError ? (
                <span className="text-destructive">!</span>
              ) : (
                activeZonesCount
              )}
            </div>
            <p className="text-sm text-muted-foreground">Active zones</p>
            {zonesError && (
              <p className="mt-2 text-xs text-destructive">{zonesError}</p>
            )}
          </div>
          
          {/* Impressions Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Impressions</h3>
            <div className="text-3xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
              ) : statsError ? (
                <span className="text-destructive">!</span>
              ) : (
                new Intl.NumberFormat().format(impressions)
              )}
            </div>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
            {statsError && (
              <p className="mt-2 text-xs text-destructive">{statsError}</p>
            )}
          </div>
          
          {/* Clicks Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Clicks</h3>
            <div className="text-3xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
              ) : statsError ? (
                <span className="text-destructive">!</span>
              ) : (
                new Intl.NumberFormat().format(clicks)
              )}
            </div>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
            {statsError && (
              <p className="mt-2 text-xs text-destructive">{statsError}</p>
            )}
          </div>
        </div>
        
        <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
          <p className="text-muted-foreground">No recent activity to display</p>
        </div>
      </div>
    </DashboardLayout>
  );
} 