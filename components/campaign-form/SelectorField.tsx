"use client";

import { useFormContext } from "react-hook-form";
import { FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form";
import { CampaignFormValues } from "@/lib/schemas/campaign";
import { CountrySelector } from "@/components/country-selector";
import { ZoneSelector } from "@/components/zone-selector";
import { BrowserSelector } from "@/components/browser-selector";
import { OsSelector } from "@/components/os-selector";
import { Zone } from "@/types/api";
import { ReactNode } from "react";

interface SelectorFieldProps {
  type: "country" | "zone" | "browser" | "os";
  label: string;
  description: string;
  icon?: ReactNode;
  zones?: Zone[]; // Required for zone selector
}

export function SelectorField({
  type,
  label,
  description,
  icon,
  zones,
}: SelectorFieldProps) {
  const form = useFormContext<CampaignFormValues>();

  const getFieldNames = () => {
    switch (type) {
      case "country":
        return {
          values: "targeting.countries" as const,
          method: "targeting.countryMethod" as const,
        };
      case "zone":
        return {
          values: "targeting.zones" as const,
          method: "targeting.zoneMethod" as const,
        };
      case "browser":
        return {
          values: "targeting.browsers" as const,
          method: "targeting.browserMethod" as const,
        };
      case "os":
        return {
          values: "targeting.os" as const,
          method: "targeting.osMethod" as const,
        };
    }
  };

  const fieldNames = getFieldNames();

  const renderSelector = () => {
    const selectedValues = form.watch(fieldNames.values);
    const targetingMethod = form.watch(fieldNames.method);

    const commonProps = {
      onChange: (value: string[]) => form.setValue(fieldNames.values, value),
      targetingMethod: targetingMethod,
      onTargetingMethodChange: (method: "whitelist" | "blacklist") =>
        form.setValue(fieldNames.method, method),
    };

    switch (type) {
      case "country":
        return (
          <CountrySelector selectedCountries={selectedValues} {...commonProps} />
        );
      case "zone":
        if (!zones) {
          console.error("Zones prop is required for zone selector");
          return null;
        }
        return (
          <ZoneSelector
            zones={zones}
            selectedZoneIds={selectedValues}
            {...commonProps}
          />
        );
      case "browser":
        return (
          <BrowserSelector selectedBrowsers={selectedValues} {...commonProps} />
        );
      case "os":
        return <OsSelector selectedOs={selectedValues} {...commonProps} />;
    }
  };

  return (
    <FormItem className="space-y-4">
      <div className="flex flex-col space-y-2">
        <FormLabel className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {label}
        </FormLabel>
        {renderSelector()}
        <FormDescription>{description}</FormDescription>
      </div>
    </FormItem>
  );
}
