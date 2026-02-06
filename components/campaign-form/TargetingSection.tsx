"use client";

import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { GlobeIcon, LayoutIcon } from "lucide-react";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { CampaignFormValues } from "@/lib/schemas/campaign";
import { DeviceTargeting } from "./DeviceTargeting";
import { SelectorField } from "./SelectorField";
import { Zone } from "@/types/api";

interface TargetingSectionProps {
  zones: Zone[];
}

export function TargetingSection({ zones }: TargetingSectionProps) {
  const form = useFormContext<CampaignFormValues>();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Targeting Rules</h2>
      <p className="text-sm text-muted-foreground">
        Add rules to control which users see your ads. If you don&apos;t add any
        rules, your ad will be shown to all users.
      </p>

      <div className="space-y-6">
        {/* First row - Device Type and Unique Users */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Device Type Targeting */}
          <DeviceTargeting />

          {/* Unique Users Targeting */}
          <FormField
            control={form.control}
            name="targeting.uniqueUsers"
            render={({ field }) => (
              <FormItem className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <FormLabel htmlFor="unique-users">Unique Users</FormLabel>
                  <div className="flex items-center">
                    <FormControl>
                      <Input
                        id="unique-users"
                        type="number"
                        min="1"
                        placeholder="Enter number"
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseInt(e.target.value, 10) : null
                          )
                        }
                        className="max-w-[150px]"
                      />
                    </FormControl>
                    <span className="ml-2 text-sm text-muted-foreground">
                      unique visits per 24h
                    </span>
                  </div>
                  <FormDescription>
                    Limit the number of times an ad can be shown to a unique user in
                    a 24-hour period.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        </div>

        {/* Second row - Country and Zone Targeting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectorField
            type="country"
            label="Country Targeting"
            description="Target users by their country. If no countries selected, all countries will be targeted."
            icon={<GlobeIcon className="h-4 w-4" />}
          />

          <SelectorField
            type="zone"
            label="Zone Targeting"
            description="Target specific ad placement zones. If no zones selected, all zones will be targeted."
            icon={<LayoutIcon className="h-4 w-4" />}
            zones={zones}
          />
        </div>

        {/* Third row - Browser and OS Targeting */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SelectorField
            type="browser"
            label="Browser Targeting"
            description="Target users by their browser. If no browsers selected, all browsers will be targeted."
          />

          <SelectorField
            type="os"
            label="OS Targeting"
            description="Target users by their operating system. If no OS selected, all OSes will be targeted."
          />
        </div>
      </div>
    </div>
  );
}
