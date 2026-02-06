"use client";

import { useFormContext, useFieldArray } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { X } from "lucide-react";
import { CampaignFormValues } from "@/lib/schemas/campaign";
import { Zone } from "@/types/api";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PayoutRulesSectionProps {
  zones: Zone[];
}

export function PayoutRulesSection({ zones }: PayoutRulesSectionProps) {
  const form = useFormContext<CampaignFormValues>();
  const { toast } = useToast();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "payoutRules.zones",
  });

  const [selectedZoneForPayout, setSelectedZoneForPayout] = useState<string>("");
  const [newZonePayout, setNewZonePayout] = useState<string>("");

  const paymentModel = form.watch("payment_model");

  // Don't render if not CPA
  if (paymentModel !== "cpa") {
    return null;
  }

  const handleAddZonePayout = () => {
    if (!selectedZoneForPayout || !newZonePayout) {
      return;
    }

    const payoutValue = parseFloat(newZonePayout);
    if (isNaN(payoutValue) || payoutValue <= 0) {
      toast({
        title: "Invalid payout",
        description: "Please enter a valid positive number",
        variant: "destructive",
      });
      return;
    }

    // Check if zone already has a payout rule
    if (fields.some((field) => field.zone_id === selectedZoneForPayout)) {
      toast({
        title: "Zone already has a payout rule",
        description: "Please remove the existing rule first",
        variant: "destructive",
      });
      return;
    }

    append({
      zone_id: selectedZoneForPayout,
      payout: payoutValue,
    });

    setSelectedZoneForPayout("");
    setNewZonePayout("");
  };

  // Get zones that don't already have payout rules
  const availableZones = zones.filter(
    (zone) => !fields.some((field) => field.zone_id === String(zone.id))
  );

  return (
    <div className="space-y-4 rounded-md border border-border bg-muted/30 p-4">
      <h3 className="text-sm font-semibold">Payout Rules</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Global Payout */}
        <FormField
          control={form.control}
          name="payoutRules.global"
          render={({ field }) => (
            <FormItem>
              <FormLabel htmlFor="global-payout">
                Default payout per conversion
              </FormLabel>
              <FormControl>
                <Input
                  id="global-payout"
                  type="number"
                  min={0}
                  max={9999.99999}
                  step="any"
                  placeholder="Enter default payout per conversion"
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                />
              </FormControl>
              <FormDescription>
                Default payout for all zones unless overridden
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Zone-specific Payout */}
        <FormItem>
          <FormLabel>Custom per zone payout</FormLabel>
          <div className="flex gap-2">
            <Select
              value={selectedZoneForPayout}
              onValueChange={setSelectedZoneForPayout}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                {availableZones.map((zone) => (
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
              className="w-32"
            />
            <Button
              type="button"
              onClick={handleAddZonePayout}
              disabled={!selectedZoneForPayout || !newZonePayout}
              size="sm"
            >
              Add rule
            </Button>
          </div>
          <FormDescription>
            Override default payout for specific zones
          </FormDescription>
        </FormItem>
      </div>

      {/* Zone Payout Rules List */}
      {fields.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs">Zone-specific rules</Label>
          <div className="space-y-1">
            {fields.map((field, index) => {
              const zone = zones.find((z) => String(z.id) === field.zone_id);
              return (
                <div
                  key={field.id}
                  className="flex items-center justify-between rounded-md bg-background p-2 text-sm"
                >
                  <span className="flex-1">{zone?.name || field.zone_id}</span>
                  <span className="font-medium mr-2">${field.payout}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
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
  );
}
