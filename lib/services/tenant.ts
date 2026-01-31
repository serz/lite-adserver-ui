import { api } from "@/lib/api";

/**
 * Tenant Settings Interface
 */
export interface TenantSettings {
  company: string;
  timezone: string;
  primary_color: string;
  secondary_color: string;
  updated_at?: number;
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
