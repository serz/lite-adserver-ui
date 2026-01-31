"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { getCampaigns, updateCampaign, getCampaignTargetingRules } from '@/lib/services/campaigns';
import { Campaign, TargetingRule, TargetingRuleType } from '@/types/api';
import { Badge, BadgeProps } from '@/components/ui/badge';
import { formatDate } from '@/lib/date-utils';
import { Button } from '@/components/ui/button';
import { RefreshCw, Play, Pause, Edit, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { getTargetingRuleTypes } from "@/lib/services/targeting-rule-types";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasInitiallyFetchedRef = useRef(false);
  const { toast } = useToast();
  const [expandedCampaigns, setExpandedCampaigns] = useState<{[campaignId: number]: boolean}>({});
  const [targetingRulesByCampaign, setTargetingRulesByCampaign] = useState<{[campaignId: number]: TargetingRule[]}>({});
  const [loadingTargetingRules, setLoadingTargetingRules] = useState<{[campaignId: number]: boolean}>({});
  const [targetingRuleTypes, setTargetingRuleTypes] = useState<TargetingRuleType[]>([]);

  const fetchCampaigns = useCallback(async (forceFetch = false) => {
    if (!hasInitiallyFetchedRef.current || forceFetch) {
      setIsLoading(true);
    }
    try {
      const response = await getCampaigns({
        limit: 20,
        useCache: false,
        sort: 'created_at',
        order: 'desc',
        _t: Date.now().toString()
      });
      setCampaigns(response.campaigns);
      setError(null);
      hasInitiallyFetchedRef.current = true;
    } catch (err) {
      setError('Failed to load campaigns. Please try refreshing.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTargetingRuleTypes = useCallback(async () => {
    try {
      const response = await getTargetingRuleTypes({ useCache: true });
      setTargetingRuleTypes(response.targeting_rule_types);
    } catch (err) {
      console.error('Failed to load targeting rule types:', err);
    }
  }, []);

  useEffect(() => {
    if (!hasInitiallyFetchedRef.current) {
      fetchCampaigns();
      fetchTargetingRuleTypes();
    }
  }, [fetchCampaigns, fetchTargetingRuleTypes]);

  const handleRefresh = async () => {
    await fetchCampaigns(true);
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    try {
      if (campaign.status === 'completed') {
        toast({
          title: "Cannot change status",
          description: "Completed campaigns cannot be reactivated.",
          variant: "destructive",
        });
        return;
      }
      const newStatus = campaign.status === 'active' ? 'paused' : 'active';
      await updateCampaign(campaign.id, { status: newStatus });
      setCampaigns(prevCampaigns =>
        prevCampaigns.map(c => c.id === campaign.id ? { ...c, status: newStatus } : c)
      );
      toast({
        title: "Success",
        description: `Campaign "${campaign.name}" has been ${newStatus === 'active' ? 'started' : 'paused'}.`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update campaign status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusVariant = (status: string): BadgeProps['variant'] => {
    switch (status) {
      case 'active': return 'active';
      case 'paused': return 'paused';
      case 'completed': return 'completed';
      case 'inactive': return 'inactive';
      default: return 'default';
    }
  };

  const toggleCampaignExpansion = async (campaignId: number) => {
    setExpandedCampaigns(prev => ({ ...prev, [campaignId]: !prev[campaignId] }));
    if (!expandedCampaigns[campaignId] && !targetingRulesByCampaign[campaignId]) {
      setLoadingTargetingRules(prev => ({ ...prev, [campaignId]: true }));
      try {
        const rules = await getCampaignTargetingRules(campaignId);
        setTargetingRulesByCampaign(prev => ({ ...prev, [campaignId]: rules }));
      } catch (err) {
        toast({
          title: "Error",
          description: "Failed to load targeting rules. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingTargetingRules(prev => ({ ...prev, [campaignId]: false }));
      }
    }
  };

  const getRuleTypeName = (ruleTypeId: number): string => {
    const ruleType = targetingRuleTypes.find(type => type.id === ruleTypeId);
    return ruleType ? ruleType.name : `Rule Type ${ruleTypeId}`;
  };

  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold md:text-3xl">Campaigns</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh campaigns"
          >
            <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <Link href="/campaigns/create">
          <Button className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90">
            New Campaign
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-destructive/15 p-4 text-destructive">
          {error}
          <Button variant="outline" size="sm" className="ml-2" onClick={handleRefresh}>
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
      ) : campaigns.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-12 px-6 text-center">
          <p className="text-lg font-medium text-foreground mb-1">No campaigns yet.</p>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Create your first campaign to start serving ads.
          </p>
          <Link href="/campaigns/create">
            <Button className="bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm hover:shadow-glow-primary transition-shadow">
              Create Campaign
            </Button>
          </Link>
        </div>
      ) : (
        <div className="min-w-0 overflow-x-auto rounded-md border bg-card [-webkit-overflow-scrolling:touch]">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Start Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">End Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(campaign => (
                <React.Fragment key={campaign.id}>
                  <tr className="border-b last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm">
                      <Button
                        variant="ghost"
                        className="h-auto p-0 flex items-center hover:bg-transparent hover:text-primary"
                        onClick={() => toggleCampaignExpansion(campaign.id)}
                      >
                        {expandedCampaigns[campaign.id]
                          ? <ChevronDown className="h-4 w-4 mr-2 text-muted-foreground" />
                          : <ChevronRight className="h-4 w-4 mr-2 text-muted-foreground" />
                        }
                        <span>{campaign.name}</span>
                      </Button>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={getStatusVariant(campaign.status)} highContrast={campaign.status === 'active'} radius="sm">
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">{formatDate(campaign.start_date)}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(campaign.end_date, { fallback: 'N/A' })}</td>
                    <td className="px-4 py-3 text-sm">{formatDate(campaign.created_at)}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={campaign.status === 'active' ? 'ghost' : 'outline'}
                          size="icon"
                          className="h-8 w-8"
                          title={campaign.status === 'active' ? 'Pause campaign' : 'Start campaign'}
                          onClick={() => handleToggleStatus(campaign)}
                          disabled={campaign.status === 'completed'}
                        >
                          {campaign.status === 'active' ? <Pause className="h-4 w-4 text-amber-500" /> : <Play className="h-4 w-4 text-green-500" />}
                        </Button>
                        <Link href={`/campaigns/edit/${campaign.id}`}>
                          <Button variant="outline" size="icon" className="h-8 w-8" title="Edit campaign">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                  {expandedCampaigns[campaign.id] && (
                    <tr className="bg-muted/20 border-b">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="border-l-2 border-primary/50 pl-4">
                          <h4 className="text-sm font-medium mb-3">Targeting Rules</h4>
                          {loadingTargetingRules[campaign.id] ? (
                            <div className="h-10 animate-pulse rounded-md bg-muted w-full"></div>
                          ) : !targetingRulesByCampaign[campaign.id] || targetingRulesByCampaign[campaign.id].length === 0 ? (
                            <p className="text-sm text-muted-foreground">No targeting rules found for this campaign</p>
                          ) : (
                            <div className="space-y-2">
                              {targetingRulesByCampaign[campaign.id].map((rule: TargetingRule, index: number) => (
                                <div key={index} className="rounded-md border bg-card/50 p-3 text-sm">
                                  <div className="flex justify-between">
                                    <div className="mt-2 text-muted-foreground">
                                      <span className="text-xs uppercase font-medium text-muted-foreground/70 mr-1">{getRuleTypeName(rule.targeting_rule_type_id)}:</span>
                                      {rule.rule.split(',').map((value, i) => (
                                        <React.Fragment key={i}>
                                          <Badge variant="outline" className="mr-1 mb-1">{value.trim()}</Badge>
                                          {i < rule.rule.split(',').length - 1 && ' '}
                                        </React.Fragment>
                                      ))}
                                    </div>
                                    <Badge variant={rule.targeting_method === 'whitelist' ? 'active' : 'destructive'} radius="sm">
                                      {rule.targeting_method === 'whitelist' ? 'Include' : 'Exclude'}
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
