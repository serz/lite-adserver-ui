import { z } from "zod";
import { Campaign, TargetingRule } from "@/types/api";

// Device type enum
export const deviceTypeEnum = z.enum(["desktop", "mobile", "tablet", "tv"]);

// Targeting method enum
export const targetingMethodEnum = z.enum(["whitelist", "blacklist"]);

// Payment model enum
export const paymentModelEnum = z.enum(["cpm", "cpa"]);

// Main campaign form schema
export const campaignFormSchema = z.object({
  // Basic fields
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters")
    .trim(),
  redirect_url: z.string().url("Please enter a valid URL").trim(),
  start_date: z.date({
    required_error: "Start date is required",
  }),
  end_date: z.date().nullable().optional(),
  payment_model: paymentModelEnum,
  rate: z.number().nullable().optional(),

  // Targeting - simplified flat structure
  targeting: z.object({
    devices: z.array(deviceTypeEnum),
    countries: z.array(z.string()),
    countryMethod: targetingMethodEnum,
    zones: z.array(z.string()),
    zoneMethod: targetingMethodEnum,
    browsers: z.array(z.string()),
    browserMethod: targetingMethodEnum,
    os: z.array(z.string()),
    osMethod: targetingMethodEnum,
    uniqueUsers: z.number().positive().nullable().optional(),
  }),

  // Payout rules (CPA only)
  payoutRules: z.object({
    global: z.number().positive().nullable().optional(),
    zones: z.array(
      z.object({
        zone_id: z.string(),
        payout: z.number().positive(),
      })
    ),
  }),
});

// Extract TypeScript type from schema
export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

// Targeting rule type IDs interface
export interface TargetingRuleTypeIds {
  device_type?: number;
  geo?: number;
  zone_id?: number;
  browser?: number;
  os?: number;
  unique_users?: number;
}

/**
 * Convert flat form values to API TargetingRule[] format
 */
export function formToTargetingRules(
  formValues: CampaignFormValues,
  ruleTypeIds: TargetingRuleTypeIds
): TargetingRule[] {
  const rules: TargetingRule[] = [];

  // Device targeting
  if (
    ruleTypeIds.device_type &&
    formValues.targeting.devices.length > 0 &&
    formValues.targeting.devices.length < 4 // Only add rule if not all devices selected
  ) {
    rules.push({
      targeting_rule_type_id: ruleTypeIds.device_type,
      targeting_method: "whitelist",
      rule: formValues.targeting.devices.join(","),
    });
  }

  // Country targeting
  if (ruleTypeIds.geo && formValues.targeting.countries.length > 0) {
    rules.push({
      targeting_rule_type_id: ruleTypeIds.geo,
      targeting_method: formValues.targeting.countryMethod,
      rule: formValues.targeting.countries.join(","),
    });
  }

  // Zone targeting
  if (ruleTypeIds.zone_id && formValues.targeting.zones.length > 0) {
    rules.push({
      targeting_rule_type_id: ruleTypeIds.zone_id,
      targeting_method: formValues.targeting.zoneMethod,
      rule: formValues.targeting.zones.join(","),
    });
  }

  // Browser targeting
  if (ruleTypeIds.browser && formValues.targeting.browsers.length > 0) {
    rules.push({
      targeting_rule_type_id: ruleTypeIds.browser,
      targeting_method: formValues.targeting.browserMethod,
      rule: formValues.targeting.browsers.join(","),
    });
  }

  // OS targeting
  if (ruleTypeIds.os && formValues.targeting.os.length > 0) {
    rules.push({
      targeting_rule_type_id: ruleTypeIds.os,
      targeting_method: formValues.targeting.osMethod,
      rule: formValues.targeting.os.join(","),
    });
  }

  // Unique users targeting
  if (ruleTypeIds.unique_users && formValues.targeting.uniqueUsers) {
    rules.push({
      targeting_rule_type_id: ruleTypeIds.unique_users,
      targeting_method: "whitelist",
      rule: `${formValues.targeting.uniqueUsers},24`, // Format: number,hours
    });
  }

  return rules;
}

/**
 * Convert API Campaign to form default values
 */
export function campaignToFormValues(
  campaign: Campaign,
  ruleTypeIds: TargetingRuleTypeIds,
  payoutRules?: { global?: number; zones: Array<{ zone_id: string; payout: number }> }
): CampaignFormValues {
  const targetingRules = campaign.targeting_rules || [];

  // Extract device targeting
  const deviceRule = targetingRules.find(
    (rule) => rule.targeting_rule_type_id === ruleTypeIds.device_type
  );
  const devices = deviceRule ? (deviceRule.rule.split(",") as Array<"desktop" | "mobile" | "tablet" | "tv">) : [];

  // Extract country targeting
  const geoRule = targetingRules.find(
    (rule) => rule.targeting_rule_type_id === ruleTypeIds.geo
  );
  const countries = geoRule ? geoRule.rule.split(",") : [];
  const countryMethod = geoRule?.targeting_method || "whitelist";

  // Extract zone targeting
  const zoneRule = targetingRules.find(
    (rule) => rule.targeting_rule_type_id === ruleTypeIds.zone_id
  );
  const zones = zoneRule ? zoneRule.rule.split(",") : [];
  const zoneMethod = zoneRule?.targeting_method || "whitelist";

  // Extract browser targeting
  const browserRule = targetingRules.find(
    (rule) => rule.targeting_rule_type_id === ruleTypeIds.browser
  );
  const browsers = browserRule ? browserRule.rule.split(",") : [];
  const browserMethod = browserRule?.targeting_method || "whitelist";

  // Extract OS targeting
  const osRule = targetingRules.find(
    (rule) => rule.targeting_rule_type_id === ruleTypeIds.os
  );
  const os = osRule ? osRule.rule.split(",") : [];
  const osMethod = osRule?.targeting_method || "whitelist";

  // Extract unique users targeting
  const uniqueUsersRule = targetingRules.find(
    (rule) => rule.targeting_rule_type_id === ruleTypeIds.unique_users
  );
  const uniqueUsers = uniqueUsersRule
    ? parseInt(uniqueUsersRule.rule.split(",")[0], 10)
    : null;

  return {
    name: campaign.name,
    redirect_url: campaign.redirect_url,
    start_date: campaign.start_date ? new Date(campaign.start_date) : new Date(),
    end_date: campaign.end_date ? new Date(campaign.end_date) : null,
    payment_model: campaign.payment_model || "cpm",
    rate: campaign.rate ?? null,
    targeting: {
      devices,
      countries,
      countryMethod,
      zones,
      zoneMethod,
      browsers,
      browserMethod,
      os,
      osMethod,
      uniqueUsers,
    },
    payoutRules: {
      global: payoutRules?.global ?? null,
      zones: payoutRules?.zones || [],
    },
  };
}

/**
 * Get default form values for creating a new campaign
 */
export function getDefaultCampaignFormValues(): CampaignFormValues {
  return {
    name: "",
    redirect_url: "",
    start_date: new Date(),
    end_date: null,
    payment_model: "cpm",
    rate: null,
    targeting: {
      devices: [],
      countries: [],
      countryMethod: "whitelist",
      zones: [],
      zoneMethod: "whitelist",
      browsers: [],
      browserMethod: "whitelist",
      os: [],
      osMethod: "whitelist",
      uniqueUsers: null,
    },
    payoutRules: {
      global: null,
      zones: [],
    },
  };
}
