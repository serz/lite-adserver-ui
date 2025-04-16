// Common types
export interface PaginationData {
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Campaign types
export interface Campaign {
  id: number;
  name: string;
  redirect_url: string;
  start_date: number;
  end_date: number | null;
  status: 'active' | 'paused' | 'completed';
  created_at: number;
  updated_at: number;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  pagination: PaginationData;
}

export interface TargetingRule {
  targeting_rule_type_id: number;
  targeting_method: 'whitelist' | 'blacklist';
  rule: string;
  weight: number;
}

// Zone types
export interface Zone {
  id: number;
  name: string;
  site_url: string;
  traffic_back_url: string;
  status: 'active' | 'paused';
  created_at: number;
  updated_at: number;
}

export interface ZonesResponse {
  zones: Zone[];
  pagination: PaginationData;
}

// Ad Event types
export interface AdEvent {
  id: number;
  event_type: 'impression' | 'click' | 'conversion';
  event_time: number;
  campaign_id: number;
  zone_id: number;
  ip: string;
  user_agent: string;
  referer: string;
  country: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  os: string;
}

export interface AdEventsResponse {
  ad_events: AdEvent[];
  pagination: PaginationData;
}

// Targeting Rule Type types
export interface TargetingRuleType {
  id: number;
  name: string;
  description: string;
}

export interface TargetingRuleTypesResponse {
  targeting_rule_types: TargetingRuleType[];
}

// Stats types
export interface CampaignStats {
  campaign_id: number;
  direct_impressions: number;
  impressions: number;
  clicks: number;
  unsold: number;
  fallbacks: number;
  ctr: number;
}

export interface StatsResponse {
  stats: CampaignStats[];
  period: {
    from: number;
    to: number;
  };
} 