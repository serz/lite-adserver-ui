"use client";

import { StatsTable } from '@/components/stats-table';
import { useStatsPage } from '@/lib/context/stats-page-context';
import { useStats } from '@/lib/context/stats-context';
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

type GroupByOption = 'date' | 'campaign_id' | 'zone_id' | 'country' | 'sub_id';

export default function StatsPage() {
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
  const { zonesCount } = useStats();

  const handleDateRangeChange = useCallback((range: DateRange | undefined) => {
    if (range?.from) {
      setDateRange({
        from: range.from,
        to: range.to || range.from,
      });
    }
  }, [setDateRange]);

  const handleRefresh = useCallback(() => {
    refetch(false);
  }, [refetch]);

  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold md:text-3xl">Statistics</h1>
      </div>

      <div className="mb-6 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-sm font-medium mb-1">Date Range</h3>
            {dateRange ? (
              <DateRangePicker
                value={{ from: dateRange.from, to: dateRange.to }}
                onChange={handleDateRangeChange}
              />
            ) : (
              <div className="h-9 w-[280px] animate-pulse rounded-md border bg-muted" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium mb-1">Group By</h3>
            <Select value={groupBy} onValueChange={(value: GroupByOption) => setGroupBy(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Group by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="campaign_id">Campaign</SelectItem>
                  <SelectItem value="zone_id">Zone</SelectItem>
                  <SelectItem value="country">Country</SelectItem>
                  <SelectItem value="sub_id">Sub ID</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading || !dateRange}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

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
          <StatsTable data={stats} groupBy={groupBy} isLoading={isLoading} zonesCount={zonesCount} />
        )}
      </div>
    </div>
  );
}
