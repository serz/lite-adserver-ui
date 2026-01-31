import type { TenantSettings } from "@/lib/services/tenant";

// In-memory cache for tenant settings (cleared on logout)
let cachedSettings: TenantSettings | null = null;
let cacheTimestamp: number | null = null;
export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export function getCachedTenantSettings(): {
  settings: TenantSettings | null;
  timestamp: number | null;
} {
  return { settings: cachedSettings, timestamp: cacheTimestamp };
}

export function setCachedTenantSettings(settings: TenantSettings | null): void {
  cachedSettings = settings;
  cacheTimestamp = settings ? Date.now() : null;
}

/**
 * Invalidate the tenant settings cache.
 * Call this on logout or after updating tenant settings.
 */
export function invalidateTenantSettingsCache() {
  cachedSettings = null;
  cacheTimestamp = null;
}
