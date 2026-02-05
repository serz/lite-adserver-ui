"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCampaign, updateCampaign, getCampaignPayoutRules, createPayoutRule, deletePayoutRule } from "@/lib/services/campaigns";
import { getZones } from "@/lib/services/zones";
import { Campaign, TargetingRule, Zone } from "@/types/api";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { getTimezone, getUtcMsForStartOfDayInTimezone, getUtcMsForEndOfDayInTimezone } from "@/lib/timezone";
import { CalendarIcon, MonitorIcon, SmartphoneIcon, TabletIcon, GlobeIcon, LayoutIcon, Tv, X } from "lucide-react";
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
import { api } from "@/lib/api";
import { CountrySelector } from "@/components/country-selector";
import { ZoneSelector } from "@/components/zone-selector";
import { RedirectUrlHelp } from "@/components/redirect-url-help";
import { TargetingButton } from "@/components/targeting-button";
import { BrowserSelector } from '@/components/browser-selector';
import { OsSelector } from '@/components/os-selector';

interface CampaignEditFormProps {
  campaignId: number;
}

export default function CampaignEditForm({ campaignId }: CampaignEditFormProps) {
  console.log("CampaignEditForm rendered with ID:", campaignId);
  const router = useRouter();
  const { toast } = useToast();
  
  // Campaign data
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  
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
  const [deviceTypeRuleId, setDeviceTypeRuleId] = useState<number | null>(null);

  // Unique users targeting state
  const [uniqueUsersValue, setUniqueUsersValue] = useState<string>("");
  const [uniqueUsersRuleId, setUniqueUsersRuleId] = useState<number | null>(null);
  
  // Payout rules state
  const [globalPayout, setGlobalPayout] = useState<string>("");
  const [originalGlobalPayout, setOriginalGlobalPayout] = useState<string>("");
  const [zonePayouts, setZonePayouts] = useState<Array<{zone_id: string, payout: string}>>([]);
  const [originalZonePayouts, setOriginalZonePayouts] = useState<Array<{zone_id: string, payout: string}>>([]);
  const [selectedZoneForPayout, setSelectedZoneForPayout] = useState<string>("");
  const [newZonePayout, setNewZonePayout] = useState<string>("");  
  
  // Payment: model (CPM/CPA) and rate for CPA
  const [pricingType, setPricingType] = useState<'cpm' | 'cpa'>('cpm');
  const [rate, setRate] = useState<string>("");

  // Country targeting state
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);
  const [countryTargetingMethod, setCountryTargetingMethod] = useState<'whitelist' | 'blacklist'>('whitelist');
  const [geoRuleId, setGeoRuleId] = useState<number | null>(null);
  
  // Zone targeting state
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>([]);
  const [zoneTargetingMethod, setZoneTargetingMethod] = useState<'whitelist' | 'blacklist'>('whitelist');
  const [zoneRuleId, setZoneRuleId] = useState<number | null>(null);
  
  // Browser targeting state
  const [selectedBrowsers, setSelectedBrowsers] = useState<string[]>([]);
  const [browserTargetingMethod, setBrowserTargetingMethod] = useState<'whitelist' | 'blacklist'>('whitelist');
  const [browserRuleId, setBrowserRuleId] = useState<number | null>(null);
  
  // OS targeting state
  const [selectedOs, setSelectedOs] = useState<string[]>([]);
  const [osTargetingMethod, setOsTargetingMethod] = useState<'whitelist' | 'blacklist'>('whitelist');
  const [osRuleId, setOsRuleId] = useState<number | null>(null);
  
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
        
        // Load zones
        const zonesResponse = await getZones({ 
          status: "active",
          limit: 100,
          useCache: true
        });
        setZones(zonesResponse.zones);
        
        // Get targeting rule types data
        const rulesResponse = await api.get<{ targeting_rule_types: Array<{id: number, name: string}> }>('/api/targeting-rule-types');
        
        // Find device type rule ID
        const deviceRule = rulesResponse.targeting_rule_types.find(rule => 
          rule.name.toLowerCase() === 'device_type'
        );
        
        if (deviceRule) {
          setDeviceTypeRuleId(deviceRule.id);
        }
        
        // Find geo rule ID
        const geoRule = rulesResponse.targeting_rule_types.find(rule => 
          rule.name.toLowerCase() === 'geo'
        );
        
        if (geoRule) {
          setGeoRuleId(geoRule.id);
        }
        
        // Find zone rule ID
        const zoneRule = rulesResponse.targeting_rule_types.find(rule => 
          rule.name.toLowerCase() === 'zone_id'
        );
        
        if (zoneRule) {
          setZoneRuleId(zoneRule.id);
        }
        
        // Find browser rule ID
        const browserRule = rulesResponse.targeting_rule_types.find(rule => rule.name.toLowerCase() === 'browser');
        if (browserRule) {
          setBrowserRuleId(browserRule.id);
        }
        
        // Find os rule ID
        const osRule = rulesResponse.targeting_rule_types.find(rule => rule.name.toLowerCase() === 'os');
        if (osRule) {
          setOsRuleId(osRule.id);
        }
        
        // Find unique users rule ID
        const uniqueUsersRule = rulesResponse.targeting_rule_types.find(
          rule => rule.name.toLowerCase() === 'unique_users'
        );
        if (uniqueUsersRule) {
          setUniqueUsersRuleId(uniqueUsersRule.id);
        }
        
        // Set campaign data
        const campaignData = response;
        setCampaign(campaignData);
        
        // Set form fields
        setName(campaignData.name);
        setRedirectUrl(campaignData.redirect_url);
        setStartDate(campaignData.start_date ? new Date(campaignData.start_date) : new Date());
        setEndDate(campaignData.end_date ? new Date(campaignData.end_date) : undefined);
        setPricingType(campaignData.payment_model === 'cpa' ? 'cpa' : 'cpm');
        setRate(campaignData.rate != null ? String(campaignData.rate) : "");
        
        // Load payout rules if CPA
        if (campaignData.payment_model === 'cpa') {
          try {
            const payoutRules = await getCampaignPayoutRules(campaignId);
            
            // Find global rule (zone_id is null)
            const globalRule = payoutRules.find(rule => rule.zone_id === null);
            if (globalRule) {
              setGlobalPayout(String(globalRule.payout));
              setOriginalGlobalPayout(String(globalRule.payout));
            }
            
            // Find zone-specific rules
            const zoneRules = payoutRules.filter(rule => rule.zone_id !== null);
            const zonePayoutsList = zoneRules.map(rule => ({
              zone_id: rule.zone_id!,
              payout: String(rule.payout)
            }));
            setZonePayouts(zonePayoutsList);
            setOriginalZonePayouts(zonePayoutsList);
          } catch (payoutError) {
            console.error("Failed to load payout rules:", payoutError);
          }
        }
        
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
          
          // Set selected countries if geo rule exists
          if (geoRule) {
            const geoTargetRule = campaignData.targeting_rules.find(
              rule => rule.targeting_rule_type_id === geoRule.id
            );
            
            if (geoTargetRule) {
              setSelectedCountries(geoTargetRule.rule.split(','));
              setCountryTargetingMethod(geoTargetRule.targeting_method);
            }
          }
          
          // Set selected zones if zone rule exists
          if (zoneRule) {
            const zoneTargetRule = campaignData.targeting_rules.find(
              rule => rule.targeting_rule_type_id === zoneRule.id
            );
            
            if (zoneTargetRule) {
              setSelectedZoneIds(zoneTargetRule.rule.split(','));
              setZoneTargetingMethod(zoneTargetRule.targeting_method);
            }
          }
          
          // Set selected browsers if browser rule exists
          if (browserRule) {
            const browserTargetRule = campaignData.targeting_rules.find(
              rule => rule.targeting_rule_type_id === browserRule.id
            );
            if (browserTargetRule) {
              setSelectedBrowsers(browserTargetRule.rule.split(','));
              setBrowserTargetingMethod(browserTargetRule.targeting_method);
            }
          }
          
          // Set selected OS if os rule exists
          if (osRule) {
            const osTargetRule = campaignData.targeting_rules.find(
              rule => rule.targeting_rule_type_id === osRule.id
            );
            if (osTargetRule) {
              setSelectedOs(osTargetRule.rule.split(','));
              setOsTargetingMethod(osTargetRule.targeting_method);
            }
          }
          
          // Set unique users if unique users rule exists
          if (uniqueUsersRule) {
            const uniqueUsersTargetRule = campaignData.targeting_rules.find(
              rule => rule.targeting_rule_type_id === uniqueUsersRule.id
            );
            if (uniqueUsersTargetRule) {
              // Extract the number from the rule format, which is number,hours
              setUniqueUsersValue(uniqueUsersTargetRule.rule.split(',')[0]);
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
  
  // Apply device targeting rules
  useEffect(() => {
    // All available device types
    const allDeviceTypes = ['desktop', 'mobile', 'tablet', 'tv'];
    
    if (!deviceTypeRuleId) {
      return;
    }
    
    // If nothing selected OR all selected = no targeting rule (allow all)
    if (selectedDevices.length === 0 || selectedDevices.length === allDeviceTypes.length) {
      setTargetingRules(prev => prev.filter(rule => rule.targeting_rule_type_id !== deviceTypeRuleId));
      return;
    }
    
    // Create the device targeting rule only for specific selections
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
  
  // Apply unique users targeting rules
  useEffect(() => {
    if (!uniqueUsersRuleId || !uniqueUsersValue) {
      // Remove any existing unique users targeting rules
      setTargetingRules(prev => prev.filter(rule => rule.targeting_rule_type_id !== uniqueUsersRuleId));
      return;
    }
    
    // Create the unique users targeting rule - format: number,hours (we hardcode 24 for hours)
    const uniqueUsersRule = {
      targeting_rule_type_id: uniqueUsersRuleId,
      targeting_method: "whitelist" as const, // Always use whitelist for unique users
      rule: `${uniqueUsersValue},24`
    };
    
    // Update targeting rules, replacing any existing unique users rule
    setTargetingRules(prev => [
      ...prev.filter(rule => rule.targeting_rule_type_id !== uniqueUsersRuleId),
      uniqueUsersRule
    ]);
  }, [uniqueUsersValue, uniqueUsersRuleId]);
  
  // Handle adding zone payout
  const handleAddZonePayout = () => {
    if (!selectedZoneForPayout || !newZonePayout) {
      return;
    }
    
    // Check if zone already has a payout rule
    if (zonePayouts.some(zp => zp.zone_id === selectedZoneForPayout)) {
      toast({
        title: "Zone already has a payout rule",
        description: "Please remove the existing rule first",
        variant: "destructive",
      });
      return;
    }
    
    setZonePayouts(prev => [...prev, { zone_id: selectedZoneForPayout, payout: newZonePayout }]);
    setSelectedZoneForPayout("");
    setNewZonePayout("");
  };
  
  // Handle removing zone payout
  const handleRemoveZonePayout = (zoneId: string) => {
    setZonePayouts(prev => prev.filter(zp => zp.zone_id !== zoneId));
  };
  
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
        setPricingType(campaignData.payment_model === 'cpa' ? 'cpa' : 'cpm');
        setRate(campaignData.rate != null ? String(campaignData.rate) : "");
        
        // Load payout rules if CPA (for retry)
        if (campaignData.payment_model === 'cpa') {
          getCampaignPayoutRules(campaignId).then(payoutRules => {
            const globalRule = payoutRules.find(rule => rule.zone_id === null);
            if (globalRule) {
              setGlobalPayout(String(globalRule.payout));
              setOriginalGlobalPayout(String(globalRule.payout));
            }
            
            const zoneRules = payoutRules.filter(rule => rule.zone_id !== null);
            const zonePayoutsList = zoneRules.map(rule => ({
              zone_id: rule.zone_id!,
              payout: String(rule.payout)
            }));
            setZonePayouts(zonePayoutsList);
            setOriginalZonePayouts(zonePayoutsList);
          }).catch(payoutError => {
            console.error("Failed to load payout rules on retry:", payoutError);
          });
        }
        
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
          
          // Set selected countries if geo rule exists
          if (geoRuleId) {
            const geoTargetRule = campaignData.targeting_rules.find(
              rule => rule.targeting_rule_type_id === geoRuleId
            );
            
            if (geoTargetRule) {
              setSelectedCountries(geoTargetRule.rule.split(','));
              setCountryTargetingMethod(geoTargetRule.targeting_method);
            }
          }
          
          // Set selected zones if zone rule exists
          if (zoneRuleId) {
            const zoneTargetRule = campaignData.targeting_rules.find(
              rule => rule.targeting_rule_type_id === zoneRuleId
            );
            
            if (zoneTargetRule) {
              setSelectedZoneIds(zoneTargetRule.rule.split(','));
              setZoneTargetingMethod(zoneTargetRule.targeting_method);
            }
          }
          
          // Set selected browsers if browser rule exists
          if (browserRuleId) {
            const browserTargetRule = campaignData.targeting_rules.find(
              rule => rule.targeting_rule_type_id === browserRuleId
            );
            
            if (browserTargetRule) {
              setSelectedBrowsers(browserTargetRule.rule.split(','));
              setBrowserTargetingMethod(browserTargetRule.targeting_method);
            }
          }
          
          // Set selected OS if os rule exists
          if (osRuleId) {
            const osTargetRule = campaignData.targeting_rules.find(
              rule => rule.targeting_rule_type_id === osRuleId
            );
            
            if (osTargetRule) {
              setSelectedOs(osTargetRule.rule.split(','));
              setOsTargetingMethod(osTargetRule.targeting_method);
            }
          }
          
          // Set unique users if unique users rule exists
          if (uniqueUsersRuleId) {
            const uniqueUsersTargetRule = campaignData.targeting_rules.find(
              rule => rule.targeting_rule_type_id === uniqueUsersRuleId
            );
            if (uniqueUsersTargetRule) {
              // Extract the number from the rule format, which is number,hours
              setUniqueUsersValue(uniqueUsersTargetRule.rule.split(',')[0]);
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
      // Start/end as 00:00 and end-of-day in tenant timezone (sent as UTC ms)
      const tz = getTimezone();
      const campaignData = {
        name: name.trim(),
        redirect_url: redirectUrl.trim(),
        start_date: startDate
          ? getUtcMsForStartOfDayInTimezone(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), tz)
          : Date.now(),
        end_date: endDate
          ? getUtcMsForEndOfDayInTimezone(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), tz)
          : null,
        payment_model: pricingType,
        rate: parseFloat(rate) || null,
        // Targeting rules are sent separately via POST .../targeting_rules
      };

      console.log("Updating campaign base data:", campaignData);

      // 1. Update campaign base details
      await updateCampaign(campaignId, campaignData); // This calls PUT /api/campaigns/:id

      console.log("Updating targeting rules:", targetingRules);

      // 2. Update targeting rules via POST /api/campaigns/:id/targeting_rules
      try {
        // Send the complete set of rules. The backend handles create/update/delete.
        // Include existing IDs for updates, omit for creates.
        // Rules not present in the array will be deleted.
        await api.post(`/api/campaigns/${campaignId}/targeting_rules`, targetingRules);
        console.log("Targeting rules updated successfully.");
      } catch (targetingError) {
        console.error("Failed to update targeting rules:", targetingError);
        // Show a specific error toast for targeting rules failure
        toast({
          title: "Targeting Update Failed",
          description: `Campaign details updated, but failed to update targeting rules. Please try saving again or contact support.`,
          variant: "destructive",
        });
        // Re-throw the error to prevent the success toast and navigation
        throw targetingError;
      }

      // 3. Update payout rules if CPA is selected
      if (pricingType === 'cpa') {
        try {
          // Handle global payout
          const currentGlobalPayout = globalPayout && parseFloat(globalPayout) > 0 ? globalPayout : "";
          const hadGlobalPayout = originalGlobalPayout !== "";
          const hasGlobalPayout = currentGlobalPayout !== "";
          
          if (hadGlobalPayout && !hasGlobalPayout) {
            // Delete global payout rule
            await deletePayoutRule(campaignId);
          } else if (hasGlobalPayout && (!hadGlobalPayout || currentGlobalPayout !== originalGlobalPayout)) {
            // Create or update global payout rule (delete + create)
            if (hadGlobalPayout) {
              await deletePayoutRule(campaignId);
            }
            await createPayoutRule(campaignId, {
              payout: parseFloat(currentGlobalPayout)
            });
          }
          
          // Handle zone-specific payouts
          // Find deleted zone payouts
          for (const originalZonePayout of originalZonePayouts) {
            if (!zonePayouts.some(zp => zp.zone_id === originalZonePayout.zone_id)) {
              await deletePayoutRule(campaignId, originalZonePayout.zone_id);
            }
          }
          
          // Find new or updated zone payouts
          for (const zonePayout of zonePayouts) {
            const originalZonePayout = originalZonePayouts.find(zp => zp.zone_id === zonePayout.zone_id);
            
            if (!originalZonePayout) {
              // New zone payout
              await createPayoutRule(campaignId, {
                payout: parseFloat(zonePayout.payout),
                zone_id: zonePayout.zone_id
              });
            } else if (zonePayout.payout !== originalZonePayout.payout) {
              // Updated zone payout (delete + create)
              await deletePayoutRule(campaignId, zonePayout.zone_id);
              await createPayoutRule(campaignId, {
                payout: parseFloat(zonePayout.payout),
                zone_id: zonePayout.zone_id
              });
            }
          }
          
          console.log("Payout rules updated successfully.");
        } catch (payoutError) {
          console.error("Failed to update payout rules:", payoutError);
          toast({
            title: "Payout Rules Update Failed",
            description: "Campaign updated, but some payout rules may not have been saved.",
            variant: "destructive",
          });
          // Don't re-throw, allow success to proceed
        }
      }

      // Show success toast (only if both updates succeed)
      toast({
        title: "Campaign updated",
        description: `${name.trim()} has been successfully updated.`,
      });

      // Navigate back to campaigns list (only if both updates succeed)
      router.push("/campaigns");

    } catch (error) {
      console.error("Failed to update campaign or targeting rules:", error);
      // This catches errors from updateCampaign OR the re-thrown targetingError
      // Keep a general error message or customize based on caught error type if needed
      setFormError("Failed to update campaign. Please check details and targeting rules, then try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Edit Campaign</h1>
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
              onClick={() => router.push("/campaigns")}
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label>Payment</Label>
                  <div className="grid grid-cols-4 gap-2 items-center pt-0.5">
                    <TargetingButton
                      active={pricingType === "cpm"}
                      onClick={() => setPricingType("cpm")}
                      disabled={isLoading}
                      indicator="green"
                      className="w-full"
                    >
                      CPM
                    </TargetingButton>
                    <TargetingButton
                      active={pricingType === "cpa"}
                      onClick={() => setPricingType("cpa")}
                      disabled={isLoading}
                      indicator="green"
                      className="w-full"
                    >
                      CPA
                    </TargetingButton>
                    <Input
                      id="rate"
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder={pricingType === "cpm" ? "Rate per 1000 visits" : "Rate per action"}
                      value={rate}
                      onChange={(e) => setRate(e.target.value)}
                      disabled={isLoading}
                      className="col-span-2"
                    />
                  </div>
                </div>
              </div>
              
              {/* Payout Rules Section - Only shown when CPA is selected */}
              {pricingType === 'cpa' && (
                <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
                  <h3 className="text-sm font-semibold">Payout Rules</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Global Payout */}
                    <div className="space-y-2">
                      <Label htmlFor="global-payout">Default payout per conversion</Label>
                      <Input
                        id="global-payout"
                        type="number"
                        min={0}
                        max={9999.99999}
                        step="any"
                        placeholder="Enter default payout per conversion"
                        value={globalPayout}
                        onChange={(e) => setGlobalPayout(e.target.value)}
                        disabled={isLoading}
                      />
                      <p className="text-xs text-muted-foreground">
                        Default payout for all zones unless overridden
                      </p>
                    </div>
                    
                    {/* Zone-specific Payout */}
                    <div className="space-y-2">
                      <Label>Custom per zone payout</Label>
                      <div className="flex gap-2">
                        <Select 
                          value={selectedZoneForPayout} 
                          onValueChange={setSelectedZoneForPayout}
                          disabled={isLoading}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {zones.filter(z => !zonePayouts.some(zp => zp.zone_id === String(z.id))).map((zone) => (
                              <SelectItem key={zone.id} value={String(zone.id)}>
                                {zone.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          type="number"
                          min={0}
                          max={9999.99999}
                          step="any"
                          placeholder="Payout"
                          value={newZonePayout}
                          onChange={(e) => setNewZonePayout(e.target.value)}
                          disabled={isLoading}
                          className="w-32"
                        />
                        <Button
                          type="button"
                          onClick={handleAddZonePayout}
                          disabled={isLoading || !selectedZoneForPayout || !newZonePayout}
                          size="sm"
                        >
                          Add rule
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Override default payout for specific zones
                      </p>
                    </div>
                  </div>
                  
                  {/* Zone Payout Rules List */}
                  {zonePayouts.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs">Zone-specific rules</Label>
                      <div className="space-y-1">
                        {zonePayouts.map((zonePayout) => {
                          const zone = zones.find(z => String(z.id) === zonePayout.zone_id);
                          return (
                            <div key={zonePayout.zone_id} className="flex items-center justify-between rounded-md bg-background p-2 text-sm">
                              <span className="flex-1">{zone?.name || zonePayout.zone_id}</span>
                              <span className="font-medium mr-2">${zonePayout.payout}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveZonePayout(zonePayout.zone_id)}
                                disabled={isLoading}
                                className="h-6 w-6 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
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
                <RedirectUrlHelp />
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
                {/* First row - Device Type and Unique Users */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Device Type Targeting */}
                  <div className="space-y-4 min-w-0">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="device-type">Device Type</Label>
                      <div className="min-w-0 overflow-x-auto md:overflow-visible">
                        <ToggleGroup 
                          type="multiple" 
                          value={selectedDevices}
                          onValueChange={setSelectedDevices}
                          className="justify-start flex-wrap gap-2 md:gap-4"
                        >
                          <ToggleGroupItem value="desktop" aria-label="Desktop" disabled={isLoading} className="flex-shrink-0">
                            <MonitorIcon className="h-4 w-4 md:mr-1" />
                            <span className="hidden md:inline">Desktop</span>
                            <span className={`md:ml-1 inline-block h-2 w-2 rounded-full flex-shrink-0 ${selectedDevices.includes("desktop") || selectedDevices.length === 0 ? "bg-green-500" : "bg-red-500"}`}></span>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="mobile" aria-label="Mobile" disabled={isLoading} className="flex-shrink-0">
                            <SmartphoneIcon className="h-4 w-4 md:mr-1" />
                            <span className="hidden md:inline">Mobile</span>
                            <span className={`md:ml-1 inline-block h-2 w-2 rounded-full flex-shrink-0 ${selectedDevices.includes("mobile") || selectedDevices.length === 0 ? "bg-green-500" : "bg-red-500"}`}></span>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="tablet" aria-label="Tablet" disabled={isLoading} className="flex-shrink-0">
                            <TabletIcon className="h-4 w-4 md:mr-1" />
                            <span className="hidden md:inline">Tablet</span>
                            <span className={`md:ml-1 inline-block h-2 w-2 rounded-full flex-shrink-0 ${selectedDevices.includes("tablet") || selectedDevices.length === 0 ? "bg-green-500" : "bg-red-500"}`}></span>
                          </ToggleGroupItem>
                          <ToggleGroupItem value="tv" aria-label="TV" disabled={isLoading} className="flex-shrink-0">
                            <Tv className="h-4 w-4 md:mr-1" />
                            <span className="hidden md:inline">TV</span>
                            <span className={`md:ml-1 inline-block h-2 w-2 rounded-full flex-shrink-0 ${selectedDevices.includes("tv") || selectedDevices.length === 0 ? "bg-green-500" : "bg-red-500"}`}></span>
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Select which device types to target. If none selected, all device types will be targeted.
                      </p>
                    </div>
                  </div>
                  
                  {/* Unique Users Targeting */}
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-2">
                      <Label htmlFor="unique-users">Unique Users</Label>
                      <div className="flex items-center">
                        <Input
                          id="unique-users"
                          type="number"
                          min="1"
                          placeholder="Enter number"
                          value={uniqueUsersValue}
                          onChange={(e) => setUniqueUsersValue(e.target.value)}
                          disabled={isLoading}
                          className="max-w-[150px]"
                        />
                        <span className="ml-2 text-sm text-muted-foreground">unique visits per 24h</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Limit the number of times an ad can be shown to a unique user in a 24-hour period.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Second row - Country and Zone Targeting */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
                
                {/* Third row - Browser and OS Targeting */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
            
            <div className="flex w-full gap-4">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1 min-w-0"
                onClick={() => router.push("/campaigns")}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 min-w-0" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Campaign"}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
