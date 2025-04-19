"use client";

import { useState, FormEvent } from "react";
import { createZone } from "@/lib/services/zones";
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

interface ZoneDialogProps {
  children?: React.ReactNode;
  triggerClassName?: string;
  onZoneCreated?: () => void;
}

export function ZoneDialog({ 
  children,
  triggerClassName,
  onZoneCreated
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
      
      // Create zone
      const response = await createZone(zoneData);
      
      // Reset form and close dialog
      resetForm();
      setIsOpen(false);
      
      // Show success toast
      toast({
        title: "Zone created",
        description: `${zoneName} has been successfully created.`,
      });
      
      try {
        // Refetch zones to update the list - with a slight delay to ensure API consistency
        await new Promise(resolve => setTimeout(resolve, 500));
        await refetchZones();
        
        // Call onZoneCreated callback if provided
        if (onZoneCreated) {
          await onZoneCreated();
        }
      } catch (refreshError) {
        // Still consider the operation successful even if refresh fails
      }
    } catch (error) {
      setFormError("Failed to create zone. Please try again.");
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
            New Zone
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Zone</DialogTitle>
          <DialogDescription>
            Enter the details for your new zone. Click save when you&apos;re done.
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
              {isLoading ? "Creating..." : "Create Zone"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 