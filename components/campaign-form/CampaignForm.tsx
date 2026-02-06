"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import {
  campaignFormSchema,
  CampaignFormValues,
  getDefaultCampaignFormValues,
  TargetingRuleTypeIds,
} from "@/lib/schemas/campaign";
import { BasicFields } from "./BasicFields";
import { TargetingSection } from "./TargetingSection";
import { PayoutRulesSection } from "./PayoutRulesSection";
import { getZones } from "@/lib/services/zones";
import { getTargetingRuleTypes } from "@/lib/services/targeting-rule-types";
import { Zone } from "@/types/api";

interface CampaignFormProps {
  initialValues?: Partial<CampaignFormValues>;
  onSubmit: (values: CampaignFormValues, ruleTypeIds: TargetingRuleTypeIds) => Promise<void>;
  submitLabel: string;
  isLoading?: boolean;
}

export function CampaignForm({
  initialValues,
  onSubmit,
  submitLabel,
  isLoading = false,
}: CampaignFormProps) {
  const [zones, setZones] = useState<Zone[]>([]);
  const [ruleTypeIds, setRuleTypeIds] = useState<TargetingRuleTypeIds>({});
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Initialize form with default values or provided initial values
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      ...getDefaultCampaignFormValues(),
      ...initialValues,
    },
  });

  // Load zones and targeting rule types
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingData(true);
        setFormError(null);

        // Load zones
        const zonesResponse = await getZones({
          status: "active",
          limit: 100,
          useCache: true,
        });
        setZones(zonesResponse.zones);

        // Load targeting rule types
        const ruleTypesResponse = await getTargetingRuleTypes({ useCache: true });

        // Map rule type names to IDs
        const ruleIds: TargetingRuleTypeIds = {};
        ruleTypesResponse.targeting_rule_types.forEach((rule) => {
          const name = rule.name.toLowerCase();
          if (name === "device_type") ruleIds.device_type = rule.id;
          else if (name === "geo") ruleIds.geo = rule.id;
          else if (name === "zone_id") ruleIds.zone_id = rule.id;
          else if (name === "browser") ruleIds.browser = rule.id;
          else if (name === "os") ruleIds.os = rule.id;
          else if (name === "unique_users") ruleIds.unique_users = rule.id;
        });
        setRuleTypeIds(ruleIds);
      } catch (error) {
        console.error("Failed to load form data:", error);
        setFormError("Failed to load form data. Please refresh the page.");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Update form when initialValues change (for edit mode)
  useEffect(() => {
    if (initialValues) {
      form.reset({
        ...getDefaultCampaignFormValues(),
        ...initialValues,
      });
    }
  }, [initialValues, form]);

  const handleSubmit = async (values: CampaignFormValues) => {
    setFormError(null);
    try {
      await onSubmit(values, ruleTypeIds);
    } catch (error) {
      console.error("Form submission error:", error);
      setFormError("Failed to save campaign. Please try again.");
    }
  };

  if (isLoadingData) {
    return (
      <div className="rounded-md border bg-card p-6">
        <div className="space-y-4">
          <div className="h-20 animate-pulse rounded-md bg-muted"></div>
          <div className="h-20 animate-pulse rounded-md bg-muted"></div>
          <div className="h-20 animate-pulse rounded-md bg-muted"></div>
          <p className="text-center text-muted-foreground">
            Loading form data...
          </p>
        </div>
      </div>
    );
  }

  if (formError) {
    return (
      <div className="rounded-md border bg-card p-6">
        <div className="rounded-md bg-destructive/15 p-4 text-destructive">
          {formError}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card p-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          {formError && (
            <div className="rounded-md bg-destructive/15 p-4 text-destructive">
              {formError}
            </div>
          )}

          {/* Basic Information Section (includes payout rules) */}
          <BasicFields zones={zones} />

          {/* Targeting Rules Section */}
          <TargetingSection zones={zones} />

          {/* Form Actions */}
          <div className="flex w-full gap-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1 min-w-0"
              onClick={() => window.history.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 min-w-0"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
