"use client";

import { useState, useEffect, useRef } from 'react';
import { updateZone, deleteZone } from '@/lib/services/zones';
import { Zone } from '@/types/api';
import { getApiUrl } from '@/lib/api';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { ZoneDialog } from '@/components/zone-dialog';
import { Button } from '@/components/ui/button';
import { RefreshCw, Pencil, Power, Code, Copy, Check, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useZones } from '@/lib/context/zone-context';

export default function ZonesPage() {
  const { toast } = useToast();
  const { listData, refetchZones } = useZones();
  
  const [copiedZoneId, setCopiedZoneId] = useState<number | string | null>(null);
  const [embedSubIdByZone, setEmbedSubIdByZone] = useState<Record<string, string>>({});
  const [zoneToDelete, setZoneToDelete] = useState<Zone | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const initialFetchDoneRef = useRef(false);

  // Initialize the list data fetch once when listData is available (avoids loop when API returns [])
  useEffect(() => {
    if (!listData || initialFetchDoneRef.current) return;
    if (listData.items.length === 0 && !listData.isLoading) {
      initialFetchDoneRef.current = true;
      listData.fetchItems(true);
    }
  }, [listData]);

  const getStatusVariant = (status: string): BadgeProps['variant'] => {
    switch (status) {
      case 'active': return 'active';
      case 'inactive': return 'inactive';
      default: return 'default';
    }
  };

  const handleRefresh = async () => {
    if (listData) {
      await listData.refresh();
    }
    await refetchZones();
  };

  const handleToggleStatus = async (zone: Zone) => {
    if (!listData) return;
    
    try {
      const newStatus = zone.status === 'active' ? 'inactive' : 'active';
      await updateZone(zone.id, { status: newStatus });
      listData.setItems(prevZones =>
        prevZones.map(z => z.id === zone.id ? { ...z, status: newStatus } : z)
      );
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

  const getPageNumbers = (): (number | string)[] => {
    if (!listData) return [1];
    const pages: (number | string)[] = [1];
    let startPage = Math.max(2, listData.currentPage - 1);
    let endPage = Math.min(listData.totalPages - 1, listData.currentPage + 1);
    if (startPage > 2) pages.push('ellipsis1');
    for (let i = startPage; i <= endPage; i++) pages.push(i);
    if (endPage < listData.totalPages - 1 && listData.totalPages > 1) pages.push('ellipsis2');
    if (listData.totalPages > 1) pages.push(listData.totalPages);
    return pages;
  };

  const getServeUrl = (zoneId: number | string) => `${getApiUrl()}/serve/${zoneId}`;

  const getShortenedId = (id: number | string): string => {
    const idStr = String(id);
    if (idStr.length <= 6) return idStr;
    return `${idStr.slice(0, 2)}...${idStr.slice(-2)}`;
  };

  const getShortenedUrl = (url: string | null | undefined, start = 12, end = 6): string => {
    if (!url || !url.trim()) return 'N/A';
    const s = url.trim();
    if (s.length <= start + end) return s;
    return `${s.slice(0, start)}...${s.slice(-end)}`;
  };

  const getEmbedUrl = (zoneId: number | string, subId: string) => {
    const base = getServeUrl(zoneId);
    if (!subId.trim()) return base;
    return `${base}?sub_id=${encodeURIComponent(subId.trim())}`;
  };

  const handleCopyCode = (zoneId: number | string, url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      toast({ title: "Copied!", description: "Embed URL copied to clipboard" });
      setCopiedZoneId(zoneId);
      setTimeout(() => setCopiedZoneId(null), 2000);
    }).catch(() => {
      toast({ title: "Error", description: "Failed to copy the embed URL", variant: "destructive" });
    });
  };

  const handleDeleteClick = (zone: Zone) => {
    setZoneToDelete(zone);
  };

  const handleDeleteConfirm = async () => {
    if (!zoneToDelete || !listData) return;
    setIsDeleting(true);
    try {
      await deleteZone(zoneToDelete.id);
      listData.setItems(prev => prev.filter(z => z.id !== zoneToDelete.id));
      setZoneToDelete(null);
      toast({
        title: "Zone deleted",
        description: `"${zoneToDelete.name}" has been deleted.`,
        variant: "default",
      });
      // Refresh the list to get accurate counts
      await listData.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete zone. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) setZoneToDelete(null);
  };

  // Show loading state if listData is not available yet
  if (!listData) {
    return (
      <div className="container mx-auto min-w-0 max-w-full p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold md:text-3xl">Zones</h1>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-md bg-muted"></div>)}
        </div>
      </div>
    );
  }

  const { items: zones, isLoading, error, currentPage, totalPages, totalItems, setPage } = listData;

  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold md:text-3xl">Zones</h1>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isLoading} title="Refresh zones">
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <ZoneDialog
          triggerClassName="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-glow-primary transition-shadow"
          onZoneCreated={handleRefresh}
        />
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
          <Button variant="outline" size="sm" className="ml-2" onClick={handleRefresh}>Retry</Button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-md bg-muted"></div>)}
        </div>
      ) : zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-12 px-6 text-center">
          <p className="text-lg font-medium text-foreground mb-1">No zones yet.</p>
          <p className="text-muted-foreground mb-6 max-w-sm">Add your first zone to define where ads can be displayed.</p>
          <ZoneDialog
            triggerClassName="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-glow-primary transition-shadow"
            onZoneCreated={handleRefresh}
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Postback URL</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(zone => (
                  <tr key={zone.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild><span>{getShortenedId(zone.id)}</span></TooltipTrigger>
                          <TooltipContent><p className="font-mono text-xs">{zone.id}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-4 py-3 text-sm">{zone.name}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={getStatusVariant(zone.status)} highContrast={zone.status === 'active'} radius="sm">
                        {zone.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild><span className="font-mono text-xs">{getShortenedUrl(zone.site_url)}</span></TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs"><p className="font-mono text-xs break-all">{zone.site_url || 'N/A'}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild><span className="font-mono text-xs">{getShortenedUrl(zone.traffic_back_url)}</span></TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs"><p className="font-mono text-xs break-all">{zone.traffic_back_url || 'N/A'}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild><span className="font-mono text-xs">{getShortenedUrl(zone.postback_url)}</span></TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs"><p className="font-mono text-xs break-all">{zone.postback_url || 'N/A'}</p></TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(zone.created_at)}</td>
                    <td className="px-4 py-3 text-sm flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="Get embed code">
                            <Code className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Zone Embed URL</DialogTitle>
                          </DialogHeader>
                          <div className="mt-4 space-y-3">
                            <div className="flex items-center p-2 bg-muted rounded-md overflow-auto">
                              <code className="text-sm flex-1 break-all">{getEmbedUrl(zone.id, embedSubIdByZone[String(zone.id)] ?? '')}</code>
                              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 ml-2" onClick={() => handleCopyCode(zone.id, getEmbedUrl(zone.id, embedSubIdByZone[String(zone.id)] ?? ''))} title="Copy to clipboard">
                                {copiedZoneId === zone.id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                              </Button>
                            </div>
                            <div>
                              <label htmlFor={`sub-id-${zone.id}`} className="text-xs text-muted-foreground">Sub ID</label>
                              <Input
                                id={`sub-id-${zone.id}`}
                                type="text"
                                placeholder="Optional"
                                value={embedSubIdByZone[String(zone.id)] ?? ''}
                                onChange={(e) => setEmbedSubIdByZone(prev => ({ ...prev, [String(zone.id)]: e.target.value }))}
                                className="mt-1"
                              />
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <ZoneDialog mode="edit" zoneId={zone.id} onZoneUpdated={handleRefresh}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Edit zone">
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
                      {zone.status === 'inactive' && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title="Delete zone"
                          onClick={() => handleDeleteClick(zone)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
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
                    <PaginationPrevious onClick={() => currentPage > 1 && setPage(currentPage - 1)} className={`cursor-pointer ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`} />
                  </PaginationItem>
                  {getPageNumbers().map((page, index) =>
                    page === 'ellipsis1' || page === 'ellipsis2' ? (
                      <PaginationItem key={`ellipsis-${index}`}><PaginationEllipsis /></PaginationItem>
                    ) : (
                      <PaginationItem key={page}>
                        <PaginationLink isActive={currentPage === page} onClick={() => setPage(page as number)} className="cursor-pointer">
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext onClick={() => currentPage < totalPages && setPage(currentPage + 1)} className={`cursor-pointer ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <div className="mt-2 text-center text-sm text-muted-foreground">
                Showing {zones.length} of {totalItems} zones
              </div>
            </div>
          )}

          <Dialog open={!!zoneToDelete} onOpenChange={(open) => !open && handleDeleteCancel()}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Delete zone</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete &quot;{zoneToDelete?.name}&quot;? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={handleDeleteCancel} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeleting}>
                  {isDeleting ? 'Deleting…' : 'Delete'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
