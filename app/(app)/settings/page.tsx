"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTenantSettings } from "@/lib/use-tenant-settings";
import { getTenantSettings, updateTenantSettings } from "@/lib/services/tenant";
import { getTimezoneOptionsWithCurrent } from "@/lib/timezones";
import { Globe } from "lucide-react";

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/;

function isValidHexColor(value: string): boolean {
  return HEX_COLOR_REGEX.test(value);
}

const COLOR_PRESETS = [
  { name: "Electric Violet", primary_color: "#7C3AED", secondary_color: "#A78BFA" },
  { name: "Royal Blue", primary_color: "#2563EB", secondary_color: "#60A5FA" },
  { name: "Neon Cyan", primary_color: "#06B6D4", secondary_color: "#67E8F9" },
  { name: "Signal Yellow", primary_color: "#FACC15", secondary_color: "#FDE047" },
  { name: "Emerald Green", primary_color: "#10B981", secondary_color: "#6EE7B7" },
  { name: "Cyber Pink", primary_color: "#EC4899", secondary_color: "#F472B6" },
] as const;

export default function SettingsPage() {
  const { toast } = useToast();
  const { refetch } = useTenantSettings();

  const [company, setCompany] = useState("");
  const [timezone, setTimezone] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#7C3AED");
  const [secondaryColor, setSecondaryColor] = useState("#6D28D9");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(true);

  // Include current timezone in options so Select can pre-select it after refresh
  const timezoneOptions = useMemo(
    () => getTimezoneOptionsWithCurrent(timezone),
    [timezone]
  );

  // Load form from API directly (hex from DB), not from cache
  useEffect(() => {
    let cancelled = false;
    setFormLoading(true);
    getTenantSettings()
      .then((data) => {
        if (cancelled) return;
        setCompany(data.company ?? "");
        setTimezone(data.timezone ?? "UTC");
        setPrimaryColor(data.primary_color ?? "#7C3AED");
        setSecondaryColor(data.secondary_color ?? "#6D28D9");
      })
      .catch(() => {
        if (!cancelled) setFormError("Failed to load settings.");
      })
      .finally(() => {
        if (!cancelled) setFormLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const companyTrimmed = company.trim();
    if (!companyTrimmed) {
      setFormError("Company name is required.");
      return;
    }
    if (!timezone) {
      setFormError("Timezone is required.");
      return;
    }
    if (!isValidHexColor(primaryColor)) {
      setFormError("Primary color must be a hex value (e.g. #7C3AED).");
      return;
    }
    if (!isValidHexColor(secondaryColor)) {
      setFormError("Secondary color must be a hex value (e.g. #6D28D9).");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTenantSettings({
        company: companyTrimmed,
        timezone,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
      });
      await refetch?.();
      toast({
        title: "Settings saved",
        description: "Platform settings have been updated.",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save settings.";
      setFormError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (formLoading) {
    return (
      <div className="container mx-auto min-w-0 max-w-full p-6">
        <h1 className="mb-6 text-2xl font-bold md:text-3xl">Platform Settings</h1>
        <div className="h-8 w-64 animate-pulse rounded bg-muted" />
        <div className="mt-6 space-y-4">
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Platform Settings</h1>

      <form onSubmit={handleSubmit} className="max-w-xl space-y-6">
        {formError && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {formError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="company">Company Name</Label>
          <Input
            id="company"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="My Company"
            disabled={isSubmitting}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground">
            Shown on the login page and in the sidebar as the platform name (logo area).
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select
            value={timezone}
            onValueChange={setTimezone}
            disabled={isSubmitting}
          >
            <SelectTrigger id="timezone" className="w-full">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {timezoneOptions.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Color scheme</Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => {
                  setPrimaryColor(preset.primary_color);
                  setSecondaryColor(preset.secondary_color);
                }}
                disabled={isSubmitting}
                className="flex w-full items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-muted disabled:opacity-50"
                title={preset.name}
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-input"
                  style={{ backgroundColor: preset.primary_color }}
                />
                <span
                  className="h-5 w-5 shrink-0 rounded-full border border-input"
                  style={{ backgroundColor: preset.secondary_color }}
                />
                <span className="truncate text-muted-foreground">{preset.name}</span>
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="space-y-2">
              <Label htmlFor="primary_color" className="text-muted-foreground text-xs font-normal">
                Primary color
              </Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="primary_color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  disabled={isSubmitting}
                  className="h-10 w-14 cursor-pointer rounded border border-input bg-background p-1"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#7C3AED"
                  disabled={isSubmitting}
                  className="font-mono flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary_color" className="text-muted-foreground text-xs font-normal">
                Secondary color
              </Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  id="secondary_color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  disabled={isSubmitting}
                  className="h-10 w-14 cursor-pointer rounded border border-input bg-background p-1"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#6D28D9"
                  disabled={isSubmitting}
                  className="font-mono flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Custom domain</Label>
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-10 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <Globe className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Coming soon</p>
            <p className="text-muted-foreground text-xs max-w-sm">
              Custom domain configuration for your ad server will be available here.
            </p>
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save settings"}
        </Button>
      </form>
    </div>
  );
}
