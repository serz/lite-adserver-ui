"use client";

import { useEffect } from "react";
import { useTenantSettings } from "@/lib/use-tenant-settings";
import { darkenHsl } from "@/lib/color-utils";

const DEFAULT_PRIMARY = "263 81% 58%";
const DEFAULT_PRIMARY_HOVER = "263 75% 50%";
const DEFAULT_SECONDARY = "263 47% 72%";

function setPrimaryVars(primaryHsl: string, secondaryHsl?: string) {
  const root = document.documentElement;
  root.style.setProperty("--primary", primaryHsl);
  root.style.setProperty("--primary-hover", darkenHsl(primaryHsl, 8));
  root.style.setProperty("--glow-primary", `0 0 12px hsl(${primaryHsl} / 0.25)`);
  const secondary = secondaryHsl ?? DEFAULT_SECONDARY;
  root.style.setProperty("--glow-secondary", `0 0 16px hsl(${secondary} / 0.2)`);
  root.style.setProperty(
    "--glow-card",
    `0 0 20px hsl(${primaryHsl} / 0.18), 0 0 40px hsl(${secondary} / 0.12), inset 0 1px 0 hsl(${primaryHsl} / 0.08)`
  );
}

function setDefaultPrimaryVars() {
  const root = document.documentElement;
  root.style.setProperty("--primary", DEFAULT_PRIMARY);
  root.style.setProperty("--primary-hover", DEFAULT_PRIMARY_HOVER);
  root.style.setProperty("--glow-primary", `0 0 12px hsl(${DEFAULT_PRIMARY} / 0.25)`);
  root.style.setProperty("--glow-secondary", `0 0 16px hsl(${DEFAULT_SECONDARY} / 0.2)`);
  root.style.setProperty(
    "--glow-card",
    `0 0 20px hsl(${DEFAULT_PRIMARY} / 0.18), 0 0 40px hsl(${DEFAULT_SECONDARY} / 0.12), inset 0 1px 0 hsl(${DEFAULT_PRIMARY} / 0.08)`
  );
}

/**
 * Applies tenant primary color to CSS variables (--primary, --primary-hover, --glow-primary).
 * When tenant settings load, overrides :root vars; when logged out, reverts to defaults.
 */
export function TenantThemeApply() {
  const { settings } = useTenantSettings();

  useEffect(() => {
    if (settings?.primary_color) {
      setPrimaryVars(settings.primary_color, settings.secondary_color);
    } else {
      setDefaultPrimaryVars();
    }
  }, [settings?.primary_color, settings?.secondary_color]);

  return null;
}
