"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getTenantSettings,
  getPublicTenantSettings,
  TenantSettings,
} from "@/lib/services/tenant";
import { useAuth } from "@/components/auth-provider";
import {
  getCachedTenantSettings,
  setCachedTenantSettings,
  CACHE_DURATION,
  invalidateTenantSettingsCache,
} from "@/lib/tenant-settings-cache";
import { hexToHsl } from "@/lib/color-utils";
import { getNamespace } from "@/lib/api";

export { invalidateTenantSettingsCache } from "@/lib/tenant-settings-cache";

/** Convert API response (hex colors) to HSL for cache/theme use */
function toHslSettings(raw: TenantSettings): TenantSettings {
  return {
    ...raw,
    primary_color: hexToHsl(raw.primary_color),
    secondary_color: hexToHsl(raw.secondary_color),
  };
}

/**
 * Hook to fetch and cache tenant settings.
 * Only fetches when the user is authenticated (has API key).
 * Returns the company name and other tenant settings.
 * Caches the settings for 5 minutes to optimize API calls.
 */
export function useTenantSettings() {
  const { isAuthenticated, isAuthReady } = useAuth();
  const [settings, setSettings] = useState<TenantSettings | null>(
    () => getCachedTenantSettings().settings
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchSettings = useCallback(async (bypassCache = false) => {
    if (!isAuthenticated) return;
    const { settings: cached, timestamp } = getCachedTenantSettings();
    if (
      !bypassCache &&
      cached &&
      timestamp &&
      Date.now() - timestamp < CACHE_DURATION
    ) {
      setSettings(cached);
      setError(null);
      return;
    }
    try {
      setIsLoading(true);
      setError(null);
      const raw = await getTenantSettings();
      const data = toHslSettings(raw);
      setCachedTenantSettings(data);
      setSettings(data);
    } catch (err) {
      console.error("Failed to fetch tenant settings:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch tenant settings"));
      const { settings: cached } = getCachedTenantSettings();
      if (cached) setSettings(cached);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated) {
      setSettings(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    fetchSettings(false);
  }, [isAuthReady, isAuthenticated, fetchSettings]);

  const refetch = useCallback(() => {
    if (!isAuthenticated) return;
    invalidateTenantSettingsCache();
    return fetchSettings(true);
  }, [isAuthenticated, fetchSettings]);

  return {
    settings,
    isLoading,
    error,
    refetch,
    company: settings?.company,
    email: settings?.email,
    timezone: settings?.timezone,
    primaryColor: settings?.primary_color,
    secondaryColor: settings?.secondary_color,
  };
}

/**
 * Fetches public tenant settings (no auth). Use on login page to customise branding.
 * Only fetches when namespace is present (e.g. subdomain). Returns company and theme colors (HSL).
 */
export function usePublicTenantSettings() {
  const [company, setCompany] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string | null>(null);
  const [secondaryColor, setSecondaryColor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const namespace = getNamespace();
    if (!namespace) {
      setCompany(null);
      setPrimaryColor(null);
      setSecondaryColor(null);
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    getPublicTenantSettings()
      .then((raw) => {
        if (cancelled) return;
        setCompany(raw.company);
        setPrimaryColor(hexToHsl(raw.primary_color));
        setSecondaryColor(hexToHsl(raw.secondary_color));
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn("Failed to fetch public tenant settings:", err);
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { company, primaryColor, secondaryColor, isLoading, error };
}
