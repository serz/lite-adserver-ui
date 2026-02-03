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
  start_date: number; // timestamp in milliseconds
  end_date: number | null; // timestamp in milliseconds
  status: 'active' | 'paused' | 'completed';
  created_at: number; // timestamp in milliseconds
  updated_at: number; // timestamp in milliseconds
  targeting_rules?: TargetingRule[]; // Optional targeting rules
  payment_model?: 'cpm' | 'cpa';
  rate?: number | null;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  pagination: PaginationData;
}

export interface TargetingRule {
  targeting_rule_type_id: number;
  targeting_method: 'whitelist' | 'blacklist';
  rule: string;
}

// Zone types (id may be number or UUID string depending on API)
export interface Zone {
  id: number | string;
  name: string;
  site_url: string;
  traffic_back_url: string;
  status: 'active' | 'inactive';
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
  impressions: number;
  clicks: number;
  unsold: number;
  fallbacks: number;
  conversions: number;
}

export interface StatsResponse {
  stats: CampaignStats[];
  period: {
    from: number;
    to: number;
  };
} 