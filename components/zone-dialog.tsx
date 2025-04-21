"use client";

import { useState, FormEvent, useEffect } from "react";
import { createZone, updateZone, getZone } from "@/lib/services/zones";
import { useZones } from "@/lib/context/zone-context";
import { useToast } from "@/hooks/use-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Zone } from "@/types/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ZoneDialogProps {
  children?: React.ReactNode;
  triggerClassName?: string;
  onZoneCreated?: () => void;
  onZoneUpdated?: () => void;
  mode?: 'create' | 'edit';
  zoneId?: number;
}

export function ZoneDialog({ 
  children,
  triggerClassName,
  onZoneCreated,
  onZoneUpdated,
  mode = 'create',
  zoneId
}: ZoneDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { refetchZones } = useZones();
  const { toast } = useToast();
  
  // Form state
  const [name, setName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [trafficBackUrl, setTrafficBackUrl] = useState("");
  
  // Field errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [siteUrlError, setSiteUrlError] = useState<string | null>(null);
  const [trafficBackUrlError, setTrafficBackUrlError] = useState<string | null>(null);
  
  // Fetch zone data when editing
  useEffect(() => {
    const fetchZoneData = async () => {
      if (mode === 'edit' && zoneId && isOpen) {
        setIsLoading(true);
        setFormError(null); // Clear any previous errors
        
        try {
          console.log(`Fetching zone data for zone ID: ${zoneId}`);
          const zone = await getZone(zoneId);
          console.log('Fetched zone data:', zone);
          
          // Verify we have valid zone data
          if (!zone || typeof zone !== 'object') {
            console.error('Invalid zone data received:', zone);
            throw new Error('Invalid zone data received from server');
          }
          
          // Update form fields with zone data
          setName(zone.name || '');
          setSiteUrl(zone.site_url || '');
          setTrafficBackUrl(zone.traffic_back_url || '');
        } catch (error) {
          console.error('Error fetching zone data:', error);
          setFormError("Failed to load zone data. Please try again.");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchZoneData();
  }, [isOpen, mode, zoneId]);

  // Form validation
  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setNameError(null);
    setSiteUrlError(null);
    setTrafficBackUrlError(null);
    
    // Validate name
    if (!name.trim()) {
      setNameError("Name is required");
      isValid = false;
    } else if (name.trim().length < 3) {
      setNameError("Name must be at least 3 characters");
      isValid = false;
    } else if (name.trim().length > 50) {
      setNameError("Name cannot exceed 50 characters");
      isValid = false;
    }
    
    // Validate site URL if provided
    if (siteUrl.trim()) {
      try {
        new URL(siteUrl);
      } catch (e) {
        setSiteUrlError("Please enter a valid URL");
        isValid = false;
      }
    }
    
    // Validate traffic back URL if provided
    if (trafficBackUrl.trim()) {
      try {
        new URL(trafficBackUrl);
      } catch (e) {
        setTrafficBackUrlError("Please enter a valid URL");
        isValid = false;
      }
    }
    
    return isValid;
  };

  // Reset form
  const resetForm = () => {
    setName("");
    setSiteUrl("");
    setTrafficBackUrl("");
    setNameError(null);
    setSiteUrlError(null);
    setTrafficBackUrlError(null);
    setFormError(null);
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset previous errors
    setFormError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data
      const zoneName = name.trim();
      const zoneData = {
        name: zoneName,
        site_url: siteUrl.trim() || undefined,
        traffic_back_url: trafficBackUrl.trim() || undefined,
      };
      
      let response: Zone;
      
      if (mode === 'create') {
        // Create zone
        response = await createZone(zoneData);
        
        // Show success toast
        toast({
          title: "Zone created",
          description: `${zoneName} has been successfully created.`,
        });
        
        // Call onZoneCreated callback if provided
        if (onZoneCreated) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await onZoneCreated();
        }
      } else {
        // Edit zone
        if (!zoneId) {
          throw new Error("Zone ID is required for editing");
        }
        
        response = await updateZone(zoneId, zoneData);
        
        // Show success toast
        toast({
          title: "Zone updated",
          description: `${zoneName} has been successfully updated.`,
        });
        
        // Call onZoneUpdated callback if provided
        if (onZoneUpdated) {
          await new Promise(resolve => setTimeout(resolve, 500));
          await onZoneUpdated();
        }
      }
      
      // Reset form and close dialog
      resetForm();
      setIsOpen(false);
      
      try {
        // Refetch zones to update the list - with a slight delay to ensure API consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        await refetchZones();
      } catch (refreshError) {
        // Still consider the operation successful even if refresh fails
      }
    } catch (error) {
      setFormError(mode === 'create' 
        ? "Failed to create zone. Please try again." 
        : "Failed to update zone. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        {children || (
          <Button className={triggerClassName}>
            {mode === 'create' ? 'New Zone' : 'Edit Zone'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create New Zone' : 'Edit Zone'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' 
              ? "Enter the details for your new zone. Click save when you're done."
              : "Update the details for this zone. Click save when you're done."
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="text-sm font-medium text-destructive">
              {formError}
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name"
              placeholder="My Zone" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
            {nameError && (
              <p className="text-xs text-destructive">{nameError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              A descriptive name for your zone
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="site_url">Site URL (Optional)</Label>
            <Input 
              id="site_url"
              placeholder="https://example.com" 
              value={siteUrl}
              onChange={(e) => setSiteUrl(e.target.value)}
              disabled={isLoading}
            />
            {siteUrlError && (
              <p className="text-xs text-destructive">{siteUrlError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The URL of the site where ads will be displayed
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="traffic_back_url">Traffic Back URL (Optional)</Label>
            <Input 
              id="traffic_back_url"
              placeholder="https://example.com/fallback" 
              value={trafficBackUrl}
              onChange={(e) => setTrafficBackUrl(e.target.value)}
              disabled={isLoading}
            />
            {trafficBackUrlError && (
              <p className="text-xs text-destructive">{trafficBackUrlError}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Fallback URL for traffic when no ads are available
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading 
                ? (mode === 'create' ? "Creating..." : "Updating...") 
                : (mode === 'create' ? "Create Zone" : "Update Zone")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 