"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { useCampaigns } from '@/lib/context/campaign-context';

export default function DashboardPage() {
  const { activeCampaignsCount, isLoading, error } = useCampaigns();

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-3xl font-bold">Dashboard</h1>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Campaign Stats Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Campaigns</h3>
            <div className="text-3xl font-bold">
              {isLoading ? (
                <div className="h-8 w-16 animate-pulse rounded bg-muted"></div>
              ) : error ? (
                <span className="text-destructive">!</span>
              ) : (
                activeCampaignsCount
              )}
            </div>
            <p className="text-sm text-muted-foreground">Active campaigns</p>
            {error && (
              <p className="mt-2 text-xs text-destructive">{error}</p>
            )}
          </div>
          
          {/* Impressions Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Impressions</h3>
            <div className="text-3xl font-bold">--</div>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
          </div>
          
          {/* Clicks Card */}
          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <h3 className="mb-2 text-lg font-medium">Clicks</h3>
            <div className="text-3xl font-bold">--</div>
            <p className="text-sm text-muted-foreground">Last 7 days</p>
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