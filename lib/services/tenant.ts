import { api, fetchPublicTenant } from "@/lib/api";

/**
 * Public tenant settings (no auth). Used e.g. on login page for branding.
 */
export interface PublicTenantSettings {
  company: string;
  primary_color: string;
  secondary_color: string;
}

/**
 * Tenant Settings Interface
 */
export interface TenantSettings {
  company: string;
  email?: string;
  timezone: string;
  primary_color: string;
  secondary_color: string;
  updated_at?: number;
}

/**
 * Fetch public tenant settings (no auth). Use on login page to customise branding.
 */
export async function getPublicTenantSettings(): Promise<PublicTenantSettings> {
  return fetchPublicTenant();
}

/**
 * Fetch tenant settings from the API
 */
export async function getTenantSettings(): Promise<TenantSettings> {
  return api.get<TenantSettings>('/api/tenant');
}

/**
 * Update tenant settings
 */
export async function updateTenantSettings(
  settings: Partial<Omit<TenantSettings, 'updated_at'>>
): Promise<TenantSettings> {
  return api.put<TenantSettings>('/api/tenant', settings);
}
