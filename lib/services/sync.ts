import { api } from '@/lib/api';

/**
 * Sync a campaign to KV storage
 * This function calls the adserver API to sync a campaign from D1 to KV
 */
export async function syncCampaign(campaignId: number): Promise<void> {
  try {
    await api.post<void>(`/api/sync/campaigns/${campaignId}`, {});
    console.log(`Synced campaign ${campaignId} to KV storage`);
  } catch (error) {
    console.error(`Failed to sync campaign ${campaignId} to KV storage:`, error);
    throw error;
  }
}

/**
 * Sync a zone to KV storage
 * This function calls the adserver API to sync a zone from D1 to KV
 */
export async function syncZone(zoneId: number): Promise<void> {
  try {
    await api.post<void>(`/api/sync/zones/${zoneId}`, {});
    console.log(`Synced zone ${zoneId} to KV storage`);
  } catch (error) {
    console.error(`Failed to sync zone ${zoneId} to KV storage:`, error);
    throw error;
  }
} 