import { api } from "@/lib/api";

/**
 * User Identity Interface
 * Returned by /api/me endpoint to validate API key and get user info
 */
export interface UserIdentity {
  namespace: string;
  user_id: string | null;
  email: string | null;
  role: string | null;
  permissions: string[];
}

/**
 * Validate API key and get current user identity
 * Used on login to validate the API key before storing it
 * 
 * @throws Error with message if validation fails (401, 400, etc.)
 */
export async function validateApiKey(): Promise<UserIdentity> {
  return api.get<UserIdentity>('/api/me');
}
