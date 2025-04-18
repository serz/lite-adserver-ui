"use client";

import { useCallback, useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { getZones } from '@/lib/services/zones';
import { Zone } from '@/types/api';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { ZoneDialog } from '@/components/zone-dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { WithAuthGuard } from '@/components/with-auth-guard';

export default function ZonesPage() {
  return (
    <DashboardLayout>
      <WithAuthGuard
        loadingComponent={
          <div className="container mx-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">Zones</h1>
              </div>
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-md bg-muted"></div>
              ))}
            </div>
          </div>
        }
      >
        <ZonesContent />
      </WithAuthGuard>
    </DashboardLayout>
  );
}

function ZonesContent() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Add a ref to track if we've already fetched data
  const hasInitiallyFetchedRef = useRef(false);

  const fetchZones = useCallback(async (forceFetch = false) => {
    // Only set loading state if we're doing an initial fetch or a forced refetch
    if (!hasInitiallyFetchedRef.current || forceFetch) {
      setIsLoading(true);
    }
    
    try {
      // Always fetch fresh data, no caching
      const response = await getZones({ 
        limit: 20, 
        useCache: false,
        sort: 'created_at',
        order: 'desc',
        // Add timestamp to query to prevent browser caching
        _t: Date.now().toString()
      });
      
      setZones(response.zones);
      setError(null);
      hasInitiallyFetchedRef.current = true;
    } catch (err) {
      setError('Failed to load zones. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Call fetchZones only once when the component mounts
  useEffect(() => {
    if (!hasInitiallyFetchedRef.current) {
      console.log('ZonesPage: Initial data fetch');
      fetchZones();
    }
  }, [fetchZones]);

  // Helper function to map status to variant
  const getStatusVariant = (status: string): BadgeProps['variant'] => {
    switch (status) {
      case 'active':
        return 'active';
      case 'inactive':
        return 'inactive';
      default:
        return 'default';
    }
  };

  // Handle manual refresh with forced refetch
  const handleRefresh = async () => {
    await fetchZones(true);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Zones</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh zones"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <ZoneDialog 
          triggerClassName="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90" 
          onZoneCreated={() => fetchZones(true)}
        />
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-2" 
            onClick={handleRefresh}
          >
            Retry
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-md bg-muted"></div>
          ))}
        </div>
      ) : zones.length === 0 ? (
        <div className="rounded-md border bg-card p-6 text-center">
          <p className="text-muted-foreground">No zones found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border bg-card">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Site URL</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Traffic Back URL</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
              </tr>
            </thead>
            <tbody>
              {zones.map(zone => (
                <tr key={zone.id} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="px-4 py-3 text-sm">{zone.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <Badge 
                      variant={getStatusVariant(zone.status)} 
                      highContrast={zone.status === 'active'} 
                      radius="sm"
                    >
                      {zone.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{zone.site_url || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{zone.traffic_back_url || 'N/A'}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(zone.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 