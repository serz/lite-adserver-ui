'use client';

import React from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';
import { StatsResponse } from '@/types/api';
import { formatDate } from '@/lib/timezone';

interface StatsTableProps {
  data: StatsResponse | null;
  groupBy: 'date' | 'campaign_id' | 'zone_id' | 'country' | 'sub_id';
  isLoading: boolean;
  /** When provided, empty state shows zone-aware copy and CTA */
  zonesCount?: number;
}

// Define a type for possible stat item based on groupBy
type StatItem = {
  date?: string;
  campaign_id?: number;
  zone_id?: number;
  country?: string;
  sub_id?: string;
  impressions: number;
  clicks: number;
  unsold: number;
  fallbacks: number;
};

export function StatsTable({ data, groupBy, isLoading, zonesCount = 0 }: StatsTableProps) {
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="h-8 w-full animate-pulse rounded bg-muted mb-2"></div>
        <div className="h-12 w-full animate-pulse rounded bg-muted mb-1"></div>
        <div className="h-12 w-full animate-pulse rounded bg-muted mb-1"></div>
        <div className="h-12 w-full animate-pulse rounded bg-muted"></div>
      </div>
    );
  }
  
  if (!data || !data.stats || data.stats.length === 0) {
    const hasZones = zonesCount > 0;
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-12 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <BarChart3 className="h-6 w-6" />
        </div>
        <p className="text-lg font-medium text-foreground mb-1">
          {hasZones ? 'No stats for this period yet' : 'No stats yet'}
        </p>
        <p className="text-muted-foreground mb-6 max-w-sm text-sm">
          {hasZones
            ? 'Get your ad link from Zones and start serving ads to see statistics here.'
            : 'Create a zone and add the ad code to your site to start seeing statistics.'}
        </p>
        <Link href="/dashboard/zones">
          <Button className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-glow-primary transition-shadow">
            Go to Zones
          </Button>
        </Link>
      </div>
    );
  }
  
  // Determine table columns based on groupBy
  const getColumnHeader = () => {
    switch (groupBy) {
      case 'date':
        return 'Date';
      case 'campaign_id':
        return 'Campaign ID';
      case 'zone_id':
        return 'Zone ID';
      case 'country':
        return 'Country';
      case 'sub_id':
        return 'Sub ID';
      default:
        return 'Group';
    }
  };
  
  // Format the group value
  const formatGroupValue = (item: StatItem) => {
    if (groupBy === 'date' && item.date) {
      return formatDate(new Date(item.date), { dateStyle: 'medium' });
    }
    return item[groupBy] || 'Unknown';
  };
  
  return (
    <div className="min-w-0 overflow-x-auto rounded-md border [-webkit-overflow-scrolling:touch]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">{getColumnHeader()}</TableHead>
            <TableHead className="text-right">Impressions</TableHead>
            <TableHead className="text-right">Fallbacks</TableHead>
            <TableHead className="text-right">Unsold</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.stats.map((item, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium">{formatGroupValue(item as StatItem)}</TableCell>
              <TableCell className="text-right">{new Intl.NumberFormat().format(item.impressions)}</TableCell>
              <TableCell className="text-right">{new Intl.NumberFormat().format(item.fallbacks)}</TableCell>
              <TableCell className="text-right">{new Intl.NumberFormat().format(item.unsold)}</TableCell>
              <TableCell className="text-right">{new Intl.NumberFormat().format(item.clicks)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
} 