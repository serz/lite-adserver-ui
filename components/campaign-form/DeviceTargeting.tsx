"use client";

import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MonitorIcon, SmartphoneIcon, TabletIcon, Tv } from "lucide-react";
import { FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { CampaignFormValues } from "@/lib/schemas/campaign";

export function DeviceTargeting() {
  const form = useFormContext<CampaignFormValues>();

  return (
    <FormField
      control={form.control}
      name="targeting.devices"
      render={({ field }) => (
        <FormItem className="space-y-4 min-w-0">
          <div className="flex flex-col space-y-2">
            <FormLabel htmlFor="device-type">Device Type</FormLabel>
            <div className="min-w-0 overflow-x-auto md:overflow-visible">
              <ToggleGroup
                type="multiple"
                value={field.value}
                onValueChange={field.onChange}
                className="justify-start flex-wrap gap-2 md:gap-4"
              >
                <ToggleGroupItem
                  value="desktop"
                  aria-label="Desktop"
                  className="flex-shrink-0"
                >
                  <MonitorIcon className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Desktop</span>
                  <span
                    className={`md:ml-1 inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                      field.value.includes("desktop") || field.value.length === 0
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="mobile"
                  aria-label="Mobile"
                  className="flex-shrink-0"
                >
                  <SmartphoneIcon className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Mobile</span>
                  <span
                    className={`md:ml-1 inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                      field.value.includes("mobile") || field.value.length === 0
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></span>
                </ToggleGroupItem>
                <ToggleGroupItem
                  value="tablet"
                  aria-label="Tablet"
                  className="flex-shrink-0"
                >
                  <TabletIcon className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Tablet</span>
                  <span
                    className={`md:ml-1 inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                      field.value.includes("tablet") || field.value.length === 0
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></span>
                </ToggleGroupItem>
                <ToggleGroupItem value="tv" aria-label="TV" className="flex-shrink-0">
                  <Tv className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">TV</span>
                  <span
                    className={`md:ml-1 inline-block h-2 w-2 rounded-full flex-shrink-0 ${
                      field.value.includes("tv") || field.value.length === 0
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></span>
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            <FormDescription>
              Select which device types to target. If none selected, all device types
              will be targeted.
            </FormDescription>
          </div>
        </FormItem>
      )}
    />
  );
}
