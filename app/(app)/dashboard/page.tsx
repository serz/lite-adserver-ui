"use client";

import { useState, useEffect, useCallback } from 'react';
import { useStats } from '@/lib/context/stats-context';
import { useUserIdentity } from '@/lib/use-user-identity';
import { getActiveCampaignsCount } from '@/lib/services/campaigns';
import { getActiveZonesCount } from '@/lib/services/zones';
import { RecentActivity } from '@/components/recent-activity';
import { DemoInstanceWarning } from '@/components/demo-instance-warning';
import { HelpCircle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { role } = useUserIdentity();
  const isOwnerOrManager = role === 'owner' || role === 'manager';

  const {
    impressions,
    clicks,
    conversions,
    campaignsCount,
    zonesCount,
    isLoading: statsLoading,
    error: statsError,
    refetchStats,
  } = useStats();

  // Advertiser: active campaigns count from /api/campaigns
  const [advertiserCampaignsCount, setAdvertiserCampaignsCount] = useState<number | null>(null);
  const [advertiserCountLoading, setAdvertiserCountLoading] = useState(false);
  const [advertiserCountError, setAdvertiserCountError] = useState<string | null>(null);
  const fetchAdvertiserCampaignsCount = useCallback(async () => {
    if (role !== 'advertiser') return;
    setAdvertiserCountLoading(true);
    setAdvertiserCountError(null);
    try {
      const count = await getActiveCampaignsCount();
      setAdvertiserCampaignsCount(count);
    } catch (err) {
      setAdvertiserCountError(err instanceof Error ? err.message : 'Failed to load count');
    } finally {
      setAdvertiserCountLoading(false);
    }
  }, [role]);
  useEffect(() => {
    if (role === 'advertiser') fetchAdvertiserCampaignsCount();
  }, [role, fetchAdvertiserCampaignsCount]);

  // Publisher: active zones count from /api/zones
  const [publisherZonesCount, setPublisherZonesCount] = useState<number | null>(null);
  const [publisherCountLoading, setPublisherCountLoading] = useState(false);
  const [publisherCountError, setPublisherCountError] = useState<string | null>(null);
  const fetchPublisherZonesCount = useCallback(async () => {
    if (role !== 'publisher') return;
    setPublisherCountLoading(true);
    setPublisherCountError(null);
    try {
      const count = await getActiveZonesCount();
      setPublisherZonesCount(count);
    } catch (err) {
      setPublisherCountError(err instanceof Error ? err.message : 'Failed to load count');
    } finally {
      setPublisherCountLoading(false);
    }
  }, [role]);
  useEffect(() => {
    if (role === 'publisher') fetchPublisherZonesCount();
  }, [role, fetchPublisherZonesCount]);

  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <div className="mb-6 flex items-center gap-2">
        <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            refetchStats();
            if (role === 'advertiser') fetchAdvertiserCampaignsCount();
            if (role === 'publisher') fetchPublisherZonesCount();
          }}
          disabled={statsLoading || (role === 'advertiser' && advertiserCountLoading) || (role === 'publisher' && publisherCountLoading)}
          title="Refresh dashboard"
        >
          <RefreshCw className={`h-5 w-5 ${(statsLoading || (role === 'advertiser' && advertiserCountLoading) || (role === 'publisher' && publisherCountLoading)) ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Demo Instance Warning Widget */}
      <div className="mb-6">
        <DemoInstanceWarning />
      </div>

      {/* Get started: owner/manager when both 0; advertiser when campaigns 0; publisher when zones 0 */}
      {isOwnerOrManager && !statsLoading && !statsError && campaignsCount === 0 && zonesCount === 0 && (
        <div className="mb-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-8 px-6 text-center">
          <p className="text-lg font-medium text-foreground mb-1">Get started</p>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Create your first campaign and add zones to start serving ads.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/campaigns/create">
              <Button className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-glow-primary transition-shadow">
                Create Campaign
              </Button>
            </Link>
            <Link href="/zones">
              <Button variant="outline">Manage Zones</Button>
            </Link>
          </div>
        </div>
      )}
      {role === 'advertiser' && !advertiserCountLoading && (advertiserCampaignsCount ?? 0) === 0 && (
        <div className="mb-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-8 px-6 text-center">
          <p className="text-lg font-medium text-foreground mb-1">Get started</p>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Create your first campaign to start running ads.
          </p>
          <Link href="/campaigns/create">
            <Button className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-glow-primary transition-shadow">
              Create Campaign
            </Button>
          </Link>
        </div>
      )}
      {role === 'publisher' && !publisherCountLoading && (publisherZonesCount ?? 0) === 0 && (
        <div className="mb-6 flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-8 px-6 text-center">
          <p className="text-lg font-medium text-foreground mb-1">Get started</p>
          <p className="text-muted-foreground mb-4 max-w-sm">
            Add your first zone to start serving ads.
          </p>
          <Link href="/zones">
            <Button className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-glow-primary transition-shadow">
              Manage Zones
            </Button>
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Campaign Stats Card — owner/manager only (from sync state) */}
        {isOwnerOrManager && (
          <div className="rounded-lg border border-primary/10 bg-card p-4 shadow-glow-card sm:p-6 transition-shadow hover:shadow-[var(--glow-primary)]">
            <h3 className="mb-2 text-lg font-medium">Campaigns</h3>
            <div className="text-3xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
              ) : statsError ? (
                <span className="text-destructive">!</span>
              ) : (
                campaignsCount
              )}
            </div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm text-muted-foreground">Active campaigns</p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3.5 w-3.5 text-muted-foreground/70" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-[300px]">
                    <p>This shows campaigns currently loaded in the ad server. Some campaigns may not appear here due to targeting rules like date range restrictions, even if they exist in your campaigns page.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {statsError && (
              <p className="mt-2 text-xs text-destructive">{statsError}</p>
            )}
          </div>
        )}

        {/* Zones Stats Card — owner/manager only (from sync state) */}
        {isOwnerOrManager && (
          <div className="rounded-lg border border-primary/10 bg-card p-4 shadow-glow-card sm:p-6 transition-shadow hover:shadow-[var(--glow-secondary)]">
            <h3 className="mb-2 text-lg font-medium">Zones</h3>
            <div className="text-3xl font-bold">
              {statsLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
              ) : statsError ? (
                <span className="text-destructive">!</span>
              ) : (
                zonesCount
              )}
            </div>
            <p className="text-sm text-muted-foreground">Active zones</p>
            {statsError && (
              <p className="mt-2 text-xs text-destructive">{statsError}</p>
            )}
          </div>
        )}

        {/* Advertiser: single Campaigns card from /api/campaigns */}
        {role === 'advertiser' && (
          <div className="rounded-lg border border-primary/10 bg-card p-4 shadow-glow-card sm:p-6 transition-shadow hover:shadow-[var(--glow-primary)]">
            <h3 className="mb-2 text-lg font-medium">Campaigns</h3>
            <div className="text-3xl font-bold">
              {advertiserCountLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
              ) : advertiserCountError ? (
                <span className="text-destructive">!</span>
              ) : (
                advertiserCampaignsCount ?? 0
              )}
            </div>
            <p className="text-sm text-muted-foreground">Active campaigns</p>
            {advertiserCountError && (
              <p className="mt-2 text-xs text-destructive">{advertiserCountError}</p>
            )}
          </div>
        )}

        {/* Publisher: single Zones card from /api/zones */}
        {role === 'publisher' && (
          <div className="rounded-lg border border-primary/10 bg-card p-4 shadow-glow-card sm:p-6 transition-shadow hover:shadow-[var(--glow-secondary)]">
            <h3 className="mb-2 text-lg font-medium">Zones</h3>
            <div className="text-3xl font-bold">
              {publisherCountLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
              ) : publisherCountError ? (
                <span className="text-destructive">!</span>
              ) : (
                publisherZonesCount ?? 0
              )}
            </div>
            <p className="text-sm text-muted-foreground">Active zones</p>
            {publisherCountError && (
              <p className="mt-2 text-xs text-destructive">{publisherCountError}</p>
            )}
          </div>
        )}

        {/* Impressions Card */}
        <div className="rounded-lg border border-primary/10 bg-card p-4 shadow-glow-card sm:p-6 transition-shadow hover:shadow-[var(--glow-primary)]">
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
        <div className="rounded-lg border border-primary/10 bg-card p-4 shadow-glow-card sm:p-6 transition-shadow hover:shadow-[var(--glow-secondary)]">
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

        {/* Conversions Card */}
        <div className="rounded-lg border border-primary/10 bg-card p-4 shadow-glow-card sm:p-6 transition-shadow hover:shadow-[var(--glow-primary)]">
          <h3 className="mb-2 text-lg font-medium">Conversions</h3>
          <div className="text-3xl font-bold">
            {statsLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
            ) : statsError ? (
              <span className="text-destructive">!</span>
            ) : (
              new Intl.NumberFormat().format(conversions)
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
        <RecentActivity />
      </div>
    </div>
  );
}
