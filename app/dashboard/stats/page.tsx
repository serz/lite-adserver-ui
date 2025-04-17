"use client";

import DashboardLayout from '@/components/dashboard-layout';
import { StatsTable } from '@/components/stats-table';
import { useStatsPage } from '@/lib/context/stats-page-context';
import { useAuth } from '@/components/auth-provider';
import { Button } from '@/components/ui/button';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DateRange } from 'react-day-picker';
import { useCallback } from 'react';

type GroupByOption = 'date' | 'campaign_id' | 'zone_id' | 'country';

export default function StatsPage() {
  const { isAuthenticated, apiInitialized } = useAuth();
  const {
    stats,
    isLoading,
    error,
    dateRange,
    setDateRange,
    groupBy,
    setGroupBy,
    refetch
  } = useStatsPage();

  // Handle date range change
  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from,
      });
    }
  }, [setDateRange]);

  // Force refresh bypassing cache
  const handleRefresh = useCallback(() => {
    // Pass false to bypass cache when manually refreshing
    refetch(false);
  }, [refetch]);

  // Handle authentication issues
  if (!isAuthenticated || !apiInitialized) {
    return (
      <DashboardLayout>
        <div className="container mx-auto p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">Statistics</h1>
          </div>
          <div className="p-6 text-center">
            <div className="p-4 text-center text-destructive bg-destructive/10 rounded-md mb-4">
              Authentication issue. Please ensure you are properly logged in.
            </div>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Statistics</h1>
        </div>

        {/* Filters section */}
        <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="text-sm font-medium mb-1">Date Range</h3>
              <DateRangePicker 
                value={{
                  from: dateRange.from,
                  to: dateRange.to
                }}
                onChange={handleDateRangeChange}
              />
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-1">Group By</h3>
              <Select 
                value={groupBy} 
                onValueChange={(value: GroupByOption) => setGroupBy(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Group by..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="campaign_id">Campaign</SelectItem>
                    <SelectItem value="zone_id">Zone</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="ml-auto flex items-center gap-2">  
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isLoading}
              >
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Stats table */}
        <div className="mb-4">
          {error ? (
            <div className="p-4 text-center text-destructive bg-destructive/10 rounded-md">
              {error}
              <div className="mt-2">
                <Button onClick={handleRefresh} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          ) : (
            <StatsTable data={stats} groupBy={groupBy} isLoading={isLoading} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 