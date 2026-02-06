"use client";

import { useAuth } from "@/components/auth-provider";

/**
 * Hook to access the current user's identity (email, role, permissions).
 * Returns null if not authenticated or identity hasn't been loaded yet.
 * 
 * Use this instead of accessing userIdentity directly from useAuth()
 * for better type safety and consistency.
 */
export function useUserIdentity() {
  const { userIdentity, isAuthenticated, isAuthReady } = useAuth();
  
  return {
    userIdentity,
    isAuthenticated,
    isAuthReady,
    email: userIdentity?.email,
    role: userIdentity?.role,
    permissions: userIdentity?.permissions ?? [],
    userId: userIdentity?.user_id,
    namespace: userIdentity?.namespace,
  };
}
