"use client";

import { useEffect, useState } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { getZones } from '@/lib/services/zones';
import { Zone } from '@/types/api';
import { useAuth } from '@/components/auth-provider';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';

export default function ZonesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, apiInitialized } = useAuth();

  useEffect(() => {
    const fetchZones = async () => {
      // Only fetch data if authenticated and API is initialized
      if (!isAuthenticated || !apiInitialized) return;
      
      setIsLoading(true);
      try {
        const response = await getZones({ limit: 20 });
        setZones(response.zones);
        setError(null);
      } catch (err) {
        setError('Failed to load zones');
      } finally {
        setIsLoading(false);
      }
    };

    fetchZones();
  }, [isAuthenticated, apiInitialized]);

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

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Zones</h1>
          <button className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            New Zone
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-destructive/15 p-4 text-destructive">
            {error}
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
                    <td className="px-4 py-3 text-sm">{zone.site_url}</td>
                    <td className="px-4 py-3 text-sm">{zone.traffic_back_url || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(zone.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
} 