"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  getCampaign,
  updateCampaign,
  getCampaignPayoutRules,
  createPayoutRule,
  deletePayoutRule,
} from "@/lib/services/campaigns";
import { getTargetingRuleTypes } from "@/lib/services/targeting-rule-types";
import {
  getTimezone,
  getUtcMsForStartOfDayInTimezone,
  getUtcMsForEndOfDayInTimezone,
} from "@/lib/timezone";
import { CampaignForm } from "@/components/campaign-form";
import {
  CampaignFormValues,
  TargetingRuleTypeIds,
  formToTargetingRules,
  campaignToFormValues,
} from "@/lib/schemas/campaign";
import { Campaign } from "@/types/api";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useCampaigns } from "@/lib/context/campaign-context";

interface EditCampaignClientProps {
  campaignId: number;
}

export default function EditCampaignClient({
  campaignId,
}: EditCampaignClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { refetchCampaigns } = useCampaigns();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [initialValues, setInitialValues] = useState<CampaignFormValues | null>(
    null
  );
  const [originalPayoutRules, setOriginalPayoutRules] = useState<{
    global?: number;
    zones: Array<{ zone_id: string; payout: number }>;
  }>({ zones: [] });
  const [ruleTypeIds, setRuleTypeIds] = useState<TargetingRuleTypeIds>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCampaignData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);

        // Fetch campaign data
        const campaignData = await api.get<Campaign>(
          `/api/campaigns/${campaignId}`
        );
        setCampaign(campaignData);

        // Get targeting rule types data
        const rulesResponse = await getTargetingRuleTypes({ useCache: true });

        // Map rule type names to IDs
        const ruleIds: TargetingRuleTypeIds = {};
        rulesResponse.targeting_rule_types.forEach((rule) => {
          const name = rule.name.toLowerCase();
          if (name === "device_type") ruleIds.device_type = rule.id;
          else if (name === "geo") ruleIds.geo = rule.id;
          else if (name === "zone_id") ruleIds.zone_id = rule.id;
          else if (name === "browser") ruleIds.browser = rule.id;
          else if (name === "os") ruleIds.os = rule.id;
          else if (name === "unique_users") ruleIds.unique_users = rule.id;
        });
        setRuleTypeIds(ruleIds);

        // Load payout rules if CPA
        let payoutData: { global?: number; zones: Array<{ zone_id: string; payout: number }> } = { zones: [] };
        if (campaignData.payment_model === "cpa") {
          try {
            const payoutRules = await getCampaignPayoutRules(campaignId);

            // Find global rule (zone_id is null)
            const globalRule = payoutRules.find((rule) => rule.zone_id === null);
            if (globalRule) {
              payoutData.global = globalRule.payout;
            }

            // Find zone-specific rules
            const zoneRules = payoutRules.filter((rule) => rule.zone_id !== null);
            payoutData.zones = zoneRules.map((rule) => ({
              zone_id: rule.zone_id!,
              payout: rule.payout,
            }));
          } catch (payoutError) {
            console.error("Failed to load payout rules:", payoutError);
          }
        }

        setOriginalPayoutRules(payoutData);

        // Convert to form values
        const formValues = campaignToFormValues(
          campaignData,
          ruleIds,
          payoutData
        );
        setInitialValues(formValues);
      } catch (error) {
        console.error("Error loading campaign:", error);
        setLoadError("Failed to load campaign data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaignData();
  }, [campaignId]);

  const handleSubmit = async (
    values: CampaignFormValues,
    ruleTypeIds: TargetingRuleTypeIds
  ) => {
    setIsSubmitting(true);
    try {
      // Convert form values to API format
      const tz = getTimezone();
      const targetingRules = formToTargetingRules(values, ruleTypeIds);

      const campaignData = {
        name: values.name,
        redirect_url: values.redirect_url,
        start_date: getUtcMsForStartOfDayInTimezone(
          values.start_date.getFullYear(),
          values.start_date.getMonth(),
          values.start_date.getDate(),
          tz
        ),
        end_date: values.end_date
          ? getUtcMsForEndOfDayInTimezone(
              values.end_date.getFullYear(),
              values.end_date.getMonth(),
              values.end_date.getDate(),
              tz
            )
          : null,
        payment_model: values.payment_model,
        rate: values.rate,
      };

      // Update campaign base details
      await updateCampaign(campaignId, campaignData);

      // Update targeting rules
      try {
        await api.post(`/api/campaigns/${campaignId}/targeting_rules`, targetingRules);
      } catch (targetingError) {
        console.error("Failed to update targeting rules:", targetingError);
        toast({
          title: "Targeting Update Failed",
          description:
            "Campaign details updated, but failed to update targeting rules. Please try saving again or contact support.",
          variant: "destructive",
        });
        throw targetingError;
      }

      // Update payout rules if CPA is selected
      if (values.payment_model === "cpa") {
        try {
          // Handle global payout
          const currentGlobal = values.payoutRules.global;
          const hadGlobal = originalPayoutRules.global !== undefined;
          const hasGlobal = currentGlobal !== null && currentGlobal !== undefined && currentGlobal > 0;

          if (hadGlobal && !hasGlobal) {
            // Delete global payout rule
            await deletePayoutRule(campaignId);
          } else if (
            hasGlobal &&
            (!hadGlobal || currentGlobal !== originalPayoutRules.global)
          ) {
            // Create or update global payout rule (delete + create)
            if (hadGlobal) {
              await deletePayoutRule(campaignId);
            }
            await createPayoutRule(campaignId, {
              payout: currentGlobal!,
            });
          }

          // Handle zone-specific payouts
          // Find deleted zone payouts
          for (const originalZonePayout of originalPayoutRules.zones) {
            if (
              !values.payoutRules.zones.some(
                (zp) => zp.zone_id === originalZonePayout.zone_id
              )
            ) {
              await deletePayoutRule(campaignId, originalZonePayout.zone_id);
            }
          }

          // Find new or updated zone payouts
          for (const zonePayout of values.payoutRules.zones) {
            const originalZonePayout = originalPayoutRules.zones.find(
              (zp) => zp.zone_id === zonePayout.zone_id
            );

            if (!originalZonePayout) {
              // New zone payout
              await createPayoutRule(campaignId, {
                payout: zonePayout.payout,
                zone_id: zonePayout.zone_id,
              });
            } else if (zonePayout.payout !== originalZonePayout.payout) {
              // Updated zone payout (delete + create)
              await deletePayoutRule(campaignId, zonePayout.zone_id);
              await createPayoutRule(campaignId, {
                payout: zonePayout.payout,
                zone_id: zonePayout.zone_id,
              });
            }
          }
        } catch (payoutError) {
          console.error("Failed to update payout rules:", payoutError);
          toast({
            title: "Payout Rules Update Failed",
            description:
              "Campaign updated, but some payout rules may not have been saved.",
            variant: "destructive",
          });
          // Don't re-throw, allow success to proceed
        }
      }

      // Show success toast
      toast({
        title: "Campaign updated",
        description: `${values.name} has been successfully updated.`,
      });

      // Invalidate campaigns cache to show the updated campaign
      await refetchCampaigns();

      // Navigate back to campaigns list
      router.push("/campaigns");
    } catch (error) {
      console.error("Failed to update campaign:", error);
      throw error; // Let CampaignForm handle the error display
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto min-w-0 max-w-full p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">Edit Campaign</h1>
          <p className="mt-2 text-muted-foreground">
            Update the campaign details
          </p>
        </div>
        <div className="rounded-md border bg-card p-6">
          <div className="space-y-4">
            <div className="h-20 animate-pulse rounded-md bg-muted"></div>
            <div className="h-20 animate-pulse rounded-md bg-muted"></div>
            <p className="text-center text-muted-foreground">
              Loading campaign data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="container mx-auto min-w-0 max-w-full p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold md:text-3xl">Edit Campaign</h1>
          <p className="mt-2 text-muted-foreground">
            Update the campaign details
          </p>
        </div>
        <div className="rounded-md border bg-card p-6">
          <div className="space-y-4 text-center">
            <div className="rounded-md bg-destructive/15 p-4 text-destructive">
              {loadError}
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant="default"
            >
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
      </div>
    );
  }

  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Edit Campaign</h1>
        <p className="mt-2 text-muted-foreground">Update the campaign details</p>
      </div>

      {initialValues && (
        <CampaignForm
          initialValues={initialValues}
          onSubmit={handleSubmit}
          submitLabel="Update Campaign"
          isLoading={isSubmitting}
        />
      )}
    </div>
  );
}
