import type { UserIdentity } from "@/lib/services/user";

// In-memory cache for user identity (cleared on logout)
let cachedUserIdentity: UserIdentity | null = null;

export function getCachedUserIdentity(): UserIdentity | null {
  return cachedUserIdentity;
}

export function setCachedUserIdentity(identity: UserIdentity | null): void {
  cachedUserIdentity = identity;
}

/**
 * Invalidate the user identity cache.
 * Call this on logout.
 */
export function invalidateUserIdentityCache() {
  cachedUserIdentity = null;
}
