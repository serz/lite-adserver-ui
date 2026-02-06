"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { createCampaign, createPayoutRule } from "@/lib/services/campaigns";
import { getTimezone, getUtcMsForStartOfDayInTimezone, getUtcMsForEndOfDayInTimezone } from "@/lib/timezone";
import { CampaignForm } from "@/components/campaign-form";
import { CampaignFormValues, TargetingRuleTypeIds, formToTargetingRules } from "@/lib/schemas/campaign";
import { useCampaigns } from "@/lib/context/campaign-context";

export default function CreateCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { refetchCampaigns } = useCampaigns();
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        targeting_rules: targetingRules.length > 0 ? targetingRules : undefined,
        payment_model: values.payment_model,
        rate: values.rate,
      };

      // Create campaign
      const newCampaign = await createCampaign(campaignData);

      // Create payout rules if CPA and any payout is set
      if (values.payment_model === "cpa") {
        try {
          // Create global payout rule if set
          if (values.payoutRules.global && values.payoutRules.global > 0) {
            await createPayoutRule(newCampaign.id, {
              payout: values.payoutRules.global,
            });
          }

          // Create zone-specific payout rules
          for (const zonePayout of values.payoutRules.zones) {
            await createPayoutRule(newCampaign.id, {
              payout: zonePayout.payout,
              zone_id: zonePayout.zone_id,
            });
          }
        } catch (payoutError) {
          console.error("Failed to create payout rules:", payoutError);
          toast({
            title: "Warning",
            description:
              "Campaign created but some payout rules may not have been saved.",
            variant: "destructive",
          });
        }
      }

      // Show success toast
      toast({
        title: "Campaign created",
        description: `${values.name} has been successfully created.`,
      });

      // Invalidate campaigns cache to show the new campaign
      await refetchCampaigns();

      // Redirect to campaigns page
      router.push("/campaigns");
    } catch (error) {
      console.error("Campaign creation error:", error);
      throw error; // Let CampaignForm handle the error display
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold md:text-3xl">Create Campaign</h1>
        <p className="mt-2 text-muted-foreground">
          Fill in the details to create a new campaign
        </p>
      </div>

      <CampaignForm
        onSubmit={handleSubmit}
        submitLabel="Create Campaign"
        isLoading={isSubmitting}
      />
    </div>
  );
} 