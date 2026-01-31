"use client";

import { useState, useEffect, useCallback } from "react";
import { getTenantSettings, TenantSettings } from "@/lib/services/tenant";
import { useAuth } from "@/components/auth-provider";
import {
  getCachedTenantSettings,
  setCachedTenantSettings,
  CACHE_DURATION,
  invalidateTenantSettingsCache,
} from "@/lib/tenant-settings-cache";

export { invalidateTenantSettingsCache } from "@/lib/tenant-settings-cache";

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
      const data = await getTenantSettings();
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
    timezone: settings?.timezone,
    primaryColor: settings?.primary_color,
    secondaryColor: settings?.secondary_color,
  };
}
