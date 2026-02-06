"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CampaignFormValues } from "@/lib/schemas/campaign";
import { TargetingButton } from "@/components/targeting-button";
import { RedirectUrlHelp } from "@/components/redirect-url-help";
import { PayoutRulesSection } from "./PayoutRulesSection";
import { Zone } from "@/types/api";

interface BasicFieldsProps {
  zones: Zone[];
}

export function BasicFields({ zones }: BasicFieldsProps) {
  const form = useFormContext<CampaignFormValues>();
  const paymentModel = form.watch("payment_model");

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Basic Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campaign Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Campaign Name <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="Summer Promotion" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Payment Model & Rate */}
        <FormItem>
          <FormLabel>Payment</FormLabel>
          <div className="grid grid-cols-4 gap-2 items-center pt-0.5">
            <TargetingButton
              active={paymentModel === "cpm"}
              onClick={() => form.setValue("payment_model", "cpm")}
              indicator="green"
              className="w-full"
            >
              CPM
            </TargetingButton>
            <TargetingButton
              active={paymentModel === "cpa"}
              onClick={() => form.setValue("payment_model", "cpa")}
              indicator="green"
              className="w-full"
            >
              CPA
            </TargetingButton>
            <FormField
              control={form.control}
              name="rate"
              render={({ field }) => (
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder={
                    paymentModel === "cpm"
                      ? "Rate per 1000 visits"
                      : "Rate per action"
                  }
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  className="col-span-2"
                />
              )}
            />
          </div>
        </FormItem>
      </div>

      {/* Payout Rules Section - Only shown when CPA is selected */}
      <PayoutRulesSection zones={zones} />

      {/* Redirect URL */}
      <FormField
        control={form.control}
        name="redirect_url"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              Redirect URL <span className="text-destructive">*</span>
            </FormLabel>
            <FormControl>
              <Input placeholder="https://example.com/landing-page" {...field} />
            </FormControl>
            <FormMessage />
            <RedirectUrlHelp />
          </FormItem>
        )}
      />

      {/* Date Pickers */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Start Date */}
        <FormField
          control={form.control}
          name="start_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : "Select date"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Date */}
        <FormField
          control={form.control}
          name="end_date"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date (Optional)</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, "PPP") : "Select date"}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={field.value || undefined}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      form.watch("start_date")
                        ? date < form.watch("start_date")
                        : false
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription>
                If not set, the campaign will run indefinitely
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
