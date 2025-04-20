"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { WithAuthGuard } from "@/components/with-auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCampaign, updateCampaign } from "@/lib/services/campaigns";
import { getZones } from "@/lib/services/zones";
import { Campaign, TargetingRule, Zone } from "@/types/api";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, MonitorIcon, SmartphoneIcon, TabletIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getTargetingRuleTypes } from "@/lib/services/targeting-rule-types";
import { api } from "@/lib/api"; // Direct API access

interface EditCampaignPageProps {
  params: {
    id: string;
  };
}

export default function EditCampaignPage({ params }: EditCampaignPageProps) {
  const campaignId = parseInt(params.id, 10);
  console.log("Edit Campaign Page - Campaign ID:", campaignId);
  
  return (
    <DashboardLayout>
      <WithAuthGuard
        loadingComponent={
          <div className="container mx-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Edit Campaign</h1>
            </div>
            <div className="h-20 animate-pulse rounded-md bg-muted"></div>
          </div>
        }
      >
        <CampaignForm campaignId={campaignId} />
      </WithAuthGuard>
    </DashboardLayout>
  );
}

interface CampaignFormProps {
  campaignId: number;
}

function CampaignForm({ campaignId }: CampaignFormProps) {
  console.log("CampaignForm rendered with ID:", campaignId);
  const router = useRouter();
  const { toast } = useToast();
  
  // Campaign data
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [targetingRules, setTargetingRules] = useState<TargetingRule[]>([]);
  
  // Device targeting state
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [deviceTypeRuleId, setDeviceTypeRuleId] = useState<number | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  
  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [redirectUrlError, setRedirectUrlError] = useState<string | null>(null);
  const [startDateError, setStartDateError] = useState<string | null>(null);
  
  // Load campaign directly from API
  useEffect(() => {
    const loadCampaignData = async () => {
      try {
        setIsLoading(true);
        setFormError(null);
        
        console.log("Directly fetching campaign data for ID:", campaignId);
        
        // Fetch campaign data directly using the API client
        const response = await api.get<Campaign>(`/api/campaigns/${campaignId}`);
        console.log("Campaign data received:", response);
        
        // Get device type rule ID
        const rulesResponse = await api.get<{ targeting_rule_types: Array<{id: number, name: string}> }>('/api/targeting-rule-types');
        const deviceRule = rulesResponse.targeting_rule_types.find(rule => 
          rule.name.toLowerCase().includes('device')
        );
        
        if (deviceRule) {
          setDeviceTypeRuleId(deviceRule.id);
        }
        
        // Set campaign data
        const campaignData = response;
        setCampaign(campaignData);
        
        // Set form fields
        setName(campaignData.name);
        setRedirectUrl(campaignData.redirect_url);
        setStartDate(campaignData.start_date ? new Date(campaignData.start_date) : new Date());
        setEndDate(campaignData.end_date ? new Date(campaignData.end_date) : undefined);
        
        // Set targeting rules if available
        if (campaignData.targeting_rules) {
          setTargetingRules(campaignData.targeting_rules);
          
          // Set selected devices if device rule exists
          if (deviceRule) {
            const deviceTargetRule = campaignData.targeting_rules.find(
              rule => rule.targeting_rule_type_id === deviceRule.id
            );
            
            if (deviceTargetRule) {
              setSelectedDevices(deviceTargetRule.rule.split(','));
            }
          }
        }
      } catch (error) {
        console.error("Error loading campaign:", error);
        setFormError("Failed to load campaign data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCampaignData();
  }, [campaignId]);
  
  // Update targeting rules when selected devices change
  useEffect(() => {
    if (!deviceTypeRuleId) return;
    
    if (selectedDevices.length === 0) {
      // Remove device targeting rule if no devices selected
      setTargetingRules(prevRules => 
        prevRules.filter(rule => rule.targeting_rule_type_id !== deviceTypeRuleId)
      );
      return;
    }
    
    // Create device targeting rule
    const deviceRule: TargetingRule = {
      targeting_rule_type_id: deviceTypeRuleId,
      targeting_method: "whitelist",
      rule: selectedDevices.join(',')
    };
    
    // Update targeting rules
    setTargetingRules(prevRules => [
      ...prevRules.filter(rule => rule.targeting_rule_type_id !== deviceTypeRuleId),
      deviceRule
    ]);
  }, [selectedDevices, deviceTypeRuleId]);
  
  // Handle retry
  const handleRetry = () => {
    setIsLoading(true);
    setFormError(null);
    
    // Directly fetch campaign data again
    api.get<Campaign>(`/api/campaigns/${campaignId}`)
      .then(response => {
        const campaignData = response;
        
        // Set form fields
        setName(campaignData.name);
        setRedirectUrl(campaignData.redirect_url);
        setStartDate(campaignData.start_date ? new Date(campaignData.start_date) : new Date());
        setEndDate(campaignData.end_date ? new Date(campaignData.end_date) : undefined);
        
        // Set targeting rules if available
        if (campaignData.targeting_rules) {
          setTargetingRules(campaignData.targeting_rules);
          
          // Set selected devices if device rule exists
          if (deviceTypeRuleId) {
            const deviceTargetRule = campaignData.targeting_rules.find(
              rule => rule.targeting_rule_type_id === deviceTypeRuleId
            );
            
            if (deviceTargetRule) {
              setSelectedDevices(deviceTargetRule.rule.split(','));
            }
          }
        }
      })
      .catch(error => {
        console.error("Retry failed:", error);
        setFormError("Failed to load campaign data. Please try again.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  };
  
  // Form validation
  const validateForm = () => {
    let isValid = true;
    
    // Reset errors
    setNameError(null);
    setRedirectUrlError(null);
    setStartDateError(null);
    
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
    
    // Validate redirect URL
    if (!redirectUrl.trim()) {
      setRedirectUrlError("Redirect URL is required");
      isValid = false;
    } else {
      try {
        new URL(redirectUrl);
      } catch (e) {
        setRedirectUrlError("Please enter a valid URL");
        isValid = false;
      }
    }
    
    // Validate start date
    if (!startDate) {
      setStartDateError("Start date is required");
      isValid = false;
    }
    
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setFormError(null);
    
    try {
      // Prepare campaign data
      const campaignData = {
        name: name.trim(),
        redirect_url: redirectUrl.trim(),
        start_date: startDate ? startDate.getTime() : Date.now(),
        end_date: endDate ? endDate.getTime() : null,
        targeting_rules: targetingRules.length > 0 ? targetingRules : undefined
      };
      
      console.log("Updating campaign with data:", campaignData);
      
      // Update campaign
      await updateCampaign(campaignId, campaignData);
      
      // Show success toast
      toast({
        title: "Campaign updated",
        description: `${name.trim()} has been successfully updated.`,
      });
      
      // Navigate back to campaigns list
      router.push("/dashboard/campaigns");
    } catch (error) {
      console.error("Failed to update campaign:", error);
      setFormError("Failed to update campaign. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Campaign</h1>
        <p className="mt-2 text-muted-foreground">Update the campaign details</p>
      </div>
      
      {isLoading ? (
        <div className="space-y-4">
          <div className="h-20 animate-pulse rounded-md bg-muted"></div>
          <div className="h-20 animate-pulse rounded-md bg-muted"></div>
          <p className="text-center text-muted-foreground">Loading campaign data...</p>
        </div>
      ) : formError ? (
        <div className="rounded-md border bg-card p-6">
          <div className="space-y-4 text-center">
            <div className="rounded-md bg-destructive/15 p-4 text-destructive">
              {formError}
            </div>
            <Button onClick={handleRetry} variant="default">
              Retry
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.push("/dashboard/campaigns")}
              className="ml-2"
            >
              Back to Campaigns
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-md border bg-card p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Basic Information</h2>
              
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input 
                  id="name"
                  placeholder="Summer Promotion" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="redirect_url">Redirect URL</Label>
                <Input 
                  id="redirect_url"
                  placeholder="https://example.com/landing-page" 
                  value={redirectUrl}
                  onChange={(e) => setRedirectUrl(e.target.value)}
                  disabled={isLoading}
                />
                {redirectUrlError && (
                  <p className="text-xs text-destructive">{redirectUrlError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Users will be redirected to this URL when they click on your ad
                </p>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="start_date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setStartDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {startDateError && (
                    <p className="text-xs text-destructive">{startDateError}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date (Optional)</Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        id="end_date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                        disabled={isLoading}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date);
                          setEndDateOpen(false);
                        }}
                        disabled={(date) => 
                          startDate ? date < startDate : false
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground">
                    If not set, the campaign will run indefinitely
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Targeting Rules</h2>
              <p className="text-sm text-muted-foreground">
                Add rules to control which users see your ads. If you don&apos;t add any rules, your ad will be shown to all users.
              </p>
              
              <div className="space-y-6">
                {/* Device Type Targeting */}
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="device-type">Device Type</Label>
                    <div className="flex flex-wrap gap-4 items-center">
                      <ToggleGroup 
                        type="multiple" 
                        value={selectedDevices}
                        onValueChange={setSelectedDevices}
                        className="justify-start"
                      >
                        <ToggleGroupItem value="desktop" aria-label="Desktop" disabled={isLoading}>
                          <MonitorIcon className="h-4 w-4 mr-1" />
                          Desktop
                        </ToggleGroupItem>
                        <ToggleGroupItem value="mobile" aria-label="Mobile" disabled={isLoading}>
                          <SmartphoneIcon className="h-4 w-4 mr-1" />
                          Mobile
                        </ToggleGroupItem>
                        <ToggleGroupItem value="tablet" aria-label="Tablet" disabled={isLoading}>
                          <TabletIcon className="h-4 w-4 mr-1" />
                          Tablet
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Select which device types to target. If none selected, all device types will be targeted.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push("/dashboard/campaigns")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Campaign"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
} 