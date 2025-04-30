"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { useStats } from '@/lib/context/stats-context';
import { RecentActivity } from '@/components/recent-activity';
import { WithAuthGuard } from '@/components/with-auth-guard';
import { DemoInstanceWarning } from '@/components/demo-instance-warning';
import { HelpCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <WithAuthGuard
        loadingComponent={
          <div className="container mx-auto p-6">
            <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-6 shadow-sm">
                  <div className="h-8 w-28 animate-pulse rounded bg-muted mb-2"></div>
                  <div className="h-10 w-16 animate-pulse rounded bg-muted"></div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <DashboardContent />
      </WithAuthGuard>
    </DashboardLayout>
  );
}

function DashboardContent() {
  const { 
    impressions, 
    clicks, 
    campaignsCount,
    zonesCount,
    isLoading: statsLoading,
    error: statsError
  } = useStats();

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
      
      {/* Demo Instance Warning Widget */}
      <div className="mb-6">
        <DemoInstanceWarning />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Campaign Stats Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
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
        
        {/* Zones Stats Card */}
        <div className="rounded-lg border bg-card p-6 shadow-sm">
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
        <RecentActivity />
      </div>
    </div>
  );
} 