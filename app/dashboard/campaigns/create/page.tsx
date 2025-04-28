"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/dashboard-layout";
import { WithAuthGuard } from "@/components/with-auth-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { createCampaign } from "@/lib/services/campaigns";
import { getZones } from "@/lib/services/zones";
import { TargetingRule, Zone } from "@/types/api";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, MonitorIcon, SmartphoneIcon, TabletIcon, GlobeIcon, LayoutIcon } from "lucide-react";
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
import { CountrySelector } from "@/components/country-selector";
import { ZoneSelector } from "@/components/zone-selector";
import { BrowserSelector } from '@/components/browser-selector';
import { OsSelector } from '@/components/os-selector';

export default function CreateCampaignPage() {
  return (
    <DashboardLayout>
      <WithAuthGuard
        loadingComponent={
          <div className="container mx-auto p-6">
            <div className="mb-6">
              <h1 className="text-3xl font-bold">Create Campaign</h1>
            </div>
            <div className="h-20 animate-pulse rounded-md bg-muted"></div>
          </div>
        }
      >
        <CampaignForm />
      </WithAuthGuard>
    </DashboardLayout>
  );
}

function CampaignForm() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Form state
  const [name, setName] = useState("");
  const [redirectUrl, setRedirectUrl] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [targetingRules, setTargetingRules] = useState<Array<{
    targeting_rule_type_id: number;
    targeting_method: "whitelist" | "blacklist";
    rule: string;
  }>>([]);
  
  // Device targeting state
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  
  // Country targeting state
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countryTargetingMethod, setCountryTargetingMethod] = useState<'whitelist' | 'blacklist'>('whitelist');
  
  // Zone targeting state
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [zoneTargetingMethod, setZoneTargetingMethod] = useState<'whitelist' | 'blacklist'>('whitelist');
  
  // Browser targeting state
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>([]);
  const [browserTargetingMethod, setBrowserTargetingMethod] = useState<'whitelist' | 'blacklist'>('whitelist');
  const [browserRuleId, setBrowserRuleId] = useState<number | null>(null);

  // OS targeting state
  const [selectedOs, setSelectedOs] = useState<string[]>([]);
  const [osTargetingMethod, setOsTargetingMethod] = useState<'whitelist' | 'blacklist'>('whitelist');
  const [osRuleId, setOsRuleId] = useState<number | null>(null);
  
  // Data for dropdowns
  const [zones, setZones] = useState<Zone[]>([]);
  const [targetingRuleTypes, setTargetingRuleTypes] = useState<{id: number, name: string}[]>([]);
  const [deviceTypeRuleId, setDeviceTypeRuleId] = useState<number | null>(null);
  const [geoRuleId, setGeoRuleId] = useState<number | null>(null);
  const [zoneRuleId, setZoneRuleId] = useState<number | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  
  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [redirectUrlError, setRedirectUrlError] = useState<string | null>(null);
  const [startDateError, setStartDateError] = useState<string | null>(null);
  
  // Load zones and targeting rule types
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load zones
        const zonesResponse = await getZones({ 
          status: "active",
          limit: 100,
          useCache: true
        });
        setZones(zonesResponse.zones);
        
        // Load targeting rule types
        const ruleTypesResponse = await getTargetingRuleTypes({ useCache: true });
        setTargetingRuleTypes(ruleTypesResponse.targeting_rule_types);
        
        // Find device type rule ID
        const deviceTypeRule = ruleTypesResponse.targeting_rule_types.find(
          rule => rule.name.toLowerCase() === 'device_type'
        );
        if (deviceTypeRule) {
          setDeviceTypeRuleId(deviceTypeRule.id);
        }
        
        // Find geo rule ID
        const geoRule = ruleTypesResponse.targeting_rule_types.find(
          rule => rule.name.toLowerCase() === 'geo'
        );
        if (geoRule) {
          setGeoRuleId(geoRule.id);
        }
        
        // Find zone rule ID
        const zoneRule = ruleTypesResponse.targeting_rule_types.find(
          rule => rule.name.toLowerCase() === 'zone_id'
        );
        if (zoneRule) {
          setZoneRuleId(zoneRule.id);
        }
        
        // Find browser rule ID
        const browserRule = ruleTypesResponse.targeting_rule_types.find(
          rule => rule.name.toLowerCase() === 'browser'
        );
        if (browserRule) {
          setBrowserRuleId(browserRule.id);
        }
        
        // Find os rule ID
        const osRule = ruleTypesResponse.targeting_rule_types.find(
          rule => rule.name.toLowerCase() === 'os'
        );
        if (osRule) {
          setOsRuleId(osRule.id);
        }
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply device targeting rules
  useEffect(() => {
    if (!deviceTypeRuleId || selectedDevices.length === 0) {
      // Remove any existing device targeting rules
      setTargetingRules(prev => prev.filter(rule => rule.targeting_rule_type_id !== deviceTypeRuleId));
      return;
    }
    
    // Create the device targeting rule
    const deviceRule = {
      targeting_rule_type_id: deviceTypeRuleId,
      targeting_method: "whitelist" as const, // Always use whitelist for devices
      rule: selectedDevices.join(',')
    };
    
    // Update targeting rules, replacing any existing device rule
    setTargetingRules(prev => [
      ...prev.filter(rule => rule.targeting_rule_type_id !== deviceTypeRuleId),
      deviceRule
    ]);
  }, [selectedDevices, deviceTypeRuleId]);
  
  // Apply country targeting rules
  useEffect(() => {
    if (!geoRuleId || selectedCountries.length === 0) {
      // Remove any existing country targeting rules
      setTargetingRules(prev => prev.filter(rule => rule.targeting_rule_type_id !== geoRuleId));
      return;
    }
    
    // Create the country targeting rule
    const countryRule = {
      targeting_rule_type_id: geoRuleId,
      targeting_method: countryTargetingMethod,
      rule: selectedCountries.join(',')
    };
    
    // Update targeting rules, replacing any existing country rule
    setTargetingRules(prev => [
      ...prev.filter(rule => rule.targeting_rule_type_id !== geoRuleId),
      countryRule
    ]);
  }, [selectedCountries, countryTargetingMethod, geoRuleId]);
  
  // Apply zone targeting rules
  useEffect(() => {
    if (!zoneRuleId || selectedZoneIds.length === 0) {
      // Remove any existing zone targeting rules
      setTargetingRules(prev => prev.filter(rule => rule.targeting_rule_type_id !== zoneRuleId));
      return;
    }
    
    // Create the zone targeting rule
    const zoneRule = {
      targeting_rule_type_id: zoneRuleId,
      targeting_method: zoneTargetingMethod,
      rule: selectedZoneIds.join(',')
    };
    
    // Update targeting rules, replacing any existing zone rule
    setTargetingRules(prev => [
      ...prev.filter(rule => rule.targeting_rule_type_id !== zoneRuleId),
      zoneRule
    ]);
  }, [selectedZoneIds, zoneTargetingMethod, zoneRuleId]);
  
  // Apply browser targeting rules
  useEffect(() => {
    if (!browserRuleId || selectedBrowsers.length === 0) {
      setTargetingRules(prev => prev.filter(rule => rule.targeting_rule_type_id !== browserRuleId));
      return;
    }
    const browserRule = {
      targeting_rule_type_id: browserRuleId,
      targeting_method: browserTargetingMethod,
      rule: selectedBrowsers.join(',')
    };
    setTargetingRules(prev => [
      ...prev.filter(rule => rule.targeting_rule_type_id !== browserRuleId),
      browserRule
    ]);
  }, [selectedBrowsers, browserTargetingMethod, browserRuleId]);

  // Apply OS targeting rules
  useEffect(() => {
    if (!osRuleId || selectedOs.length === 0) {
      setTargetingRules(prev => prev.filter(rule => rule.targeting_rule_type_id !== osRuleId));
      return;
    }
    const osRule = {
      targeting_rule_type_id: osRuleId,
      targeting_method: osTargetingMethod,
      rule: selectedOs.join(',')
    };
    setTargetingRules(prev => [
      ...prev.filter(rule => rule.targeting_rule_type_id !== osRuleId),
      osRule
    ]);
  }, [selectedOs, osTargetingMethod, osRuleId]);
  
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
    
    // Reset previous errors
    setFormError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Prepare data
      const campaignData = {
        name: name.trim(),
        redirect_url: redirectUrl.trim(),
        start_date: startDate ? startDate.getTime() : Date.now(),
        end_date: endDate ? endDate.getTime() : null,
        targeting_rules: targetingRules.length > 0 ? targetingRules : undefined
      };
      
      // Create campaign
      await createCampaign(campaignData);
      
      // Show success toast
      toast({
        title: "Campaign created",
        description: `${name.trim()} has been successfully created.`,
      });
      
      // Redirect to campaigns page
      router.push("/dashboard/campaigns");
    } catch (error) {
      setFormError("Failed to create campaign. Please try again.");
      console.error("Campaign creation error:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Campaign</h1>
        <p className="mt-2 text-muted-foreground">Fill in the details to create a new campaign</p>
      </div>
      
      <div className="rounded-md border bg-card p-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          {formError && (
            <div className="rounded-md bg-destructive/15 p-4 text-destructive">
              {formError}
            </div>
          )}
          
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
              
              {/* Country Targeting */}
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label className="flex items-center">
                    <GlobeIcon className="h-4 w-4 mr-2" />
                    Country Targeting
                  </Label>
                  <CountrySelector
                    selectedCountries={selectedCountries}
                    onChange={setSelectedCountries}
                    targetingMethod={countryTargetingMethod}
                    onTargetingMethodChange={setCountryTargetingMethod}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Target users by their country. If no countries selected, all countries will be targeted.
                  </p>
                </div>
              </div>
              
              {/* Zone Targeting */}
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label className="flex items-center">
                    <LayoutIcon className="h-4 w-4 mr-2" />
                    Zone Targeting
                  </Label>
                  <ZoneSelector
                    zones={zones}
                    selectedZoneIds={selectedZoneIds}
                    onChange={setSelectedZoneIds}
                    targetingMethod={zoneTargetingMethod}
                    onTargetingMethodChange={setZoneTargetingMethod}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Target specific ad placement zones. If no zones selected, all zones will be targeted.
                  </p>
                </div>
              </div>
              
              {/* Browser Targeting */}
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label className="flex items-center">
                    Browser Targeting
                  </Label>
                  <BrowserSelector
                    selectedBrowsers={selectedBrowsers}
                    onChange={setSelectedBrowsers}
                    targetingMethod={browserTargetingMethod}
                    onTargetingMethodChange={setBrowserTargetingMethod}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Target users by their browser. If no browsers selected, all browsers will be targeted.
                  </p>
                </div>
              </div>
              
              {/* OS Targeting */}
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <Label className="flex items-center">
                    OS Targeting
                  </Label>
                  <OsSelector
                    selectedOs={selectedOs}
                    onChange={setSelectedOs}
                    targetingMethod={osTargetingMethod}
                    onTargetingMethodChange={setOsTargetingMethod}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Target users by their operating system. If no OS selected, all OSes will be targeted.
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
              {isLoading ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 