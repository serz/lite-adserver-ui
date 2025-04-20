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
import { getTargetingRuleTypes } from "@/lib/services/targeting-rule-types";
import { getZones } from "@/lib/services/zones";
import { TargetingRuleType, TargetingRule, Zone } from "@/types/api";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [targetingRules, setTargetingRules] = useState<Array<{
    targeting_rule_type_id: number;
    targeting_method: "whitelist" | "blacklist";
    rule: string;
  }>>([]);
  
  // Data for dropdowns
  const [targetingRuleTypes, setTargetingRuleTypes] = useState<TargetingRuleType[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);

  // Temporary state for adding new targeting rule
  const [newRuleType, setNewRuleType] = useState<number | undefined>(undefined);
  const [newRuleMethod, setNewRuleMethod] = useState<"whitelist" | "blacklist">("whitelist");
  const [newRuleText, setNewRuleText] = useState("");
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  
  // Validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [redirectUrlError, setRedirectUrlError] = useState<string | null>(null);
  const [startDateError, setStartDateError] = useState<string | null>(null);
  const [newRuleError, setNewRuleError] = useState<string | null>(null);
  
  // Load targeting rule types
  useEffect(() => {
    const fetchTargetingRuleTypes = async () => {
      try {
        const response = await getTargetingRuleTypes({ useCache: true });
        setTargetingRuleTypes(response.targeting_rule_types);
      } catch (error) {
        console.error("Failed to load targeting rule types:", error);
      }
    };
    
    const fetchZones = async () => {
      try {
        const response = await getZones({ 
          status: "active",
          limit: 100,
          useCache: true
        });
        setZones(response.zones);
      } catch (error) {
        console.error("Failed to load zones:", error);
      }
    };
    
    fetchTargetingRuleTypes();
    fetchZones();
  }, []);
  
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
  
  // Add targeting rule
  const addTargetingRule = () => {
    // Validate
    if (!newRuleType) {
      setNewRuleError("Please select a rule type");
      return;
    }
    
    if (!newRuleText.trim()) {
      setNewRuleError("Rule text is required");
      return;
    }
    
    // Add rule
    setTargetingRules([
      ...targetingRules,
      {
        targeting_rule_type_id: newRuleType,
        targeting_method: newRuleMethod,
        rule: newRuleText.trim()
      }
    ]);
    
    // Reset new rule form
    setNewRuleType(undefined);
    setNewRuleMethod("whitelist");
    setNewRuleText("");
    setNewRuleError(null);
  };
  
  // Remove targeting rule
  const removeTargetingRule = (index: number) => {
    const updatedRules = [...targetingRules];
    updatedRules.splice(index, 1);
    setTargetingRules(updatedRules);
  };
  
  // Get rule type name by id
  const getRuleTypeName = (id: number) => {
    const ruleType = targetingRuleTypes.find(type => type.id === id);
    return ruleType ? ruleType.name : `Rule Type ${id}`;
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
        start_date: startDate ? Math.floor(startDate.getTime() / 1000) : Math.floor(Date.now() / 1000),
        end_date: endDate ? Math.floor(endDate.getTime() / 1000) : null,
        status,
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
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={status} 
                onValueChange={(value: "active" | "paused") => setStatus(value)}
                disabled={isLoading}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Set to paused if you want to set up the campaign now but activate it later
              </p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Targeting Rules</h2>
            <p className="text-sm text-muted-foreground">
              Add rules to control which users see your ads. If you don&apos;t add any rules, your ad will be shown to all users.
            </p>
            
            {targetingRules.length > 0 && (
              <div className="rounded-md border p-4">
                <h3 className="mb-3 font-medium">Current Rules</h3>
                <div className="space-y-2">
                  {targetingRules.map((rule, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div>
                        <span className="font-medium">{getRuleTypeName(rule.targeting_rule_type_id)}: </span>
                        <Badge variant={rule.targeting_method === "whitelist" ? "active" : "inactive"} className="mr-2">
                          {rule.targeting_method}
                        </Badge>
                        <span className="text-sm">{rule.rule}</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => removeTargetingRule(index)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="rounded-md border p-4">
              <h3 className="mb-3 font-medium">Add Rule</h3>
              
              <div className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <div>
                    <Label htmlFor="rule_type">Rule Type</Label>
                    <Select 
                      value={newRuleType?.toString() || ""} 
                      onValueChange={(value) => setNewRuleType(Number(value))}
                      disabled={isLoading || targetingRuleTypes.length === 0}
                    >
                      <SelectTrigger id="rule_type">
                        <SelectValue placeholder="Select rule type" />
                      </SelectTrigger>
                      <SelectContent>
                        {targetingRuleTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id.toString()}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="rule_method">Method</Label>
                    <Select 
                      value={newRuleMethod} 
                      onValueChange={(value: "whitelist" | "blacklist") => setNewRuleMethod(value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger id="rule_method">
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whitelist">Whitelist (Include)</SelectItem>
                        <SelectItem value="blacklist">Blacklist (Exclude)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="rule_text">Rule Value</Label>
                  <Input 
                    id="rule_text"
                    placeholder="e.g., US,CA,UK for countries" 
                    value={newRuleText}
                    onChange={(e) => setNewRuleText(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                
                {newRuleError && (
                  <p className="text-xs text-destructive">{newRuleError}</p>
                )}
                
                <Button 
                  type="button"
                  variant="outline"
                  onClick={addTargetingRule}
                  disabled={isLoading}
                  className="mt-2"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Rule
                </Button>
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