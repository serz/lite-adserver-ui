"use client";

import { useCallback, useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/dashboard-layout';
import { getZones, updateZone } from '@/lib/services/zones';
import { Zone } from '@/types/api';
import { getApiUrl } from '@/lib/api';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { ZoneDialog } from '@/components/zone-dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Pencil, Power, Code, Copy, Check } from 'lucide-react';
import { WithAuthGuard } from '@/components/with-auth-guard';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10;
  // Add a ref to track if we've already fetched data
  const hasInitiallyFetchedRef = useRef(false);
  // Add toast for notifications
  const { toast } = useToast();
  // Add state to track which code has been copied
  const [copiedZoneId, setCopiedZoneId] = useState<number | string | null>(null);

  const fetchZones = useCallback(async (forceFetch = false, page = currentPage) => {
    // Only set loading state if we're doing an initial fetch or a forced refetch
    if (!hasInitiallyFetchedRef.current || forceFetch) {
      setIsLoading(true);
    }
    
    try {
      const offset = (page - 1) * itemsPerPage;

      // Always fetch fresh data, no caching
      const response = await getZones({ 
        limit: itemsPerPage, 
        offset,
        useCache: false,
        sort: 'created_at',
        order: 'desc',
        // Add timestamp to query to prevent browser caching
        _t: Date.now().toString()
      });
      
      setZones(response.zones);
      setTotalItems(response.pagination.total);
      setTotalPages(Math.ceil(response.pagination.total / itemsPerPage));
      setError(null);
      hasInitiallyFetchedRef.current = true;
    } catch (err) {
      setError('Failed to load zones. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage]);

  // Call fetchZones when currentPage changes
  useEffect(() => {
    fetchZones(false, currentPage);
  }, [fetchZones, currentPage]);

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
    await fetchZones(true, currentPage);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle zone status toggle
  const handleToggleStatus = async (zone: Zone) => {
    try {
      const newStatus = zone.status === 'active' ? 'inactive' : 'active';
      await updateZone(zone.id, { status: newStatus });
      
      // Update local state
      setZones(prevZones => 
        prevZones.map(z => 
          z.id === zone.id ? { ...z, status: newStatus } : z
        )
      );
      
      // Show success toast
      toast({
        title: "Success",
        description: `Zone "${zone.name}" has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update zone status. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Generate an array of page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    // Always show first page
    pages.push(1);
    
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis if there's a gap after first page
    if (startPage > 2) {
      pages.push('ellipsis1');
    }
    
    // Add pages around current page
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    // Add ellipsis if there's a gap before last page
    if (endPage < totalPages - 1 && totalPages > 1) {
      pages.push('ellipsis2');
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  // Get the serve URL for a zone
  const getServeUrl = (zoneId: number | string) => {
    return `${getApiUrl()}/serve/${zoneId}`;
  };

  // Handle copy to clipboard
  const handleCopyCode = (zoneId: number | string) => {
    const codeText = getServeUrl(zoneId);
    navigator.clipboard.writeText(codeText).then(() => {
      // Show success toast
      toast({
        title: "Copied!",
        description: "Embed URL copied to clipboard",
      });
      
      // Set the copied state to show the check icon
      setCopiedZoneId(zoneId);
      
      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setCopiedZoneId(null);
      }, 2000);
    }).catch(err => {
      // Show error toast if copying fails
      toast({
        title: "Error",
        description: "Failed to copy the embed URL",
        variant: "destructive",
      });
    });
  };

  return (
    <div className="container mx-auto min-w-0 p-6">
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
          triggerClassName="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-glow-primary transition-shadow" 
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
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-12 px-6 text-center">
          <p className="text-lg font-medium text-foreground mb-1">No zones yet.</p>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Add your first zone to define where ads can be displayed.
          </p>
          <ZoneDialog
            triggerClassName="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-glow-primary transition-shadow"
            onZoneCreated={() => fetchZones(true)}
          >
            <Button className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-glow-primary transition-shadow">
              Add Zone
            </Button>
          </ZoneDialog>
        </div>
      ) : (
        <>
          <div className="min-w-0 overflow-x-auto rounded-md border bg-card [-webkit-overflow-scrolling:touch]">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">ID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Site URL</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Traffic Back URL</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(zone => (
                  <tr key={zone.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">{zone.id}</td>
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
                    <td className="px-4 py-3 text-sm flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Get embed code"
                          >
                            <Code className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Zone Embed URL</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 flex items-center p-2 bg-muted rounded-md overflow-auto">
                            <code className="text-sm flex-1">{getServeUrl(zone.id)}</code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 flex-shrink-0 ml-2"
                              onClick={() => handleCopyCode(zone.id)}
                              title="Copy to clipboard"
                            >
                              {copiedZoneId === zone.id ? (
                                <Check className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <ZoneDialog
                        mode="edit"
                        zoneId={zone.id}
                        onZoneUpdated={() => fetchZones(true)}
                      >
                        <Button 
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Edit zone"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </ZoneDialog>
                      
                      <Button
                        variant={zone.status === 'active' ? 'ghost' : 'outline'}
                        size="icon"
                        className="h-8 w-8"
                        title={zone.status === 'active' ? 'Deactivate zone' : 'Activate zone'}
                        onClick={() => handleToggleStatus(zone)}
                      >
                        <Power className={`h-4 w-4 ${zone.status === 'active' ? 'text-green-500' : 'text-amber-500'}`} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      className={`cursor-pointer ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                    />
                  </PaginationItem>
                  
                  {getPageNumbers().map((page, index) => (
                    page === 'ellipsis1' || page === 'ellipsis2' ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          isActive={currentPage === page}
                          onClick={() => handlePageChange(page as number)}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  ))}
                  
                  <PaginationItem>
                    <PaginationNext 
                      onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                      className={`cursor-pointer ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <div className="mt-2 text-center text-sm text-muted-foreground">
                Showing {zones.length} of {totalItems} zones
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
} 