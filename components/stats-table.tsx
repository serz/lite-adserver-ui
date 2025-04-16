'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatsResponse } from '@/types/api';
import { formatDate } from '@/lib/timezone';

interface StatsTableProps {
  data: StatsResponse | null;
  groupBy: 'date' | 'campaign_id' | 'zone_id' | 'country';
  isLoading: boolean;
}

// Define a type for possible stat item based on groupBy
type StatItem = {
  date?: string;
  campaign_id?: number;
  zone_id?: number;
  country?: string;
  impressions: number;
  clicks: number;
  unsold: number;
  fallbacks: number;
};

export function StatsTable({ data, groupBy, isLoading }: StatsTableProps) {
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
    return (
      <div className="py-4 text-center text-muted-foreground">
        No data available for the selected period
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
    <div className="rounded-md border">
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