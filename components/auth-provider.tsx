"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getApiKey, setApiKey, clearApiKey, isLoggedIn } from '@/lib/auth';
import { api } from '@/lib/api';
import { invalidateTenantSettingsCache } from '@/lib/tenant-settings-cache';
import { validateApiKey } from '@/lib/services/user';
import { getCachedUserIdentity, setCachedUserIdentity, invalidateUserIdentityCache } from '@/lib/user-identity-cache';
import { invalidateCampaignCaches } from '@/lib/services/campaigns';
import { invalidateZoneCaches } from '@/lib/services/zones';
import { invalidateStatsCache } from '@/lib/services/stats';
import { invalidateConversionsCache } from '@/lib/services/conversions';
import { invalidateTargetingRuleTypesCache } from '@/lib/services/targeting-rule-types';
import type { UserIdentity } from '@/lib/services/user';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (apiKey: string) => Promise<void>;
  logout: () => void;
  apiInitialized: boolean;
  isAuthReady: boolean;
  userIdentity: UserIdentity | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [apiInitialized, setApiInitialized] = useState<boolean>(false);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const [userIdentity, setUserIdentity] = useState<UserIdentity | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if the user is authenticated on mount and initialize API
    const initAuth = async () => {
      try {
        const loggedIn = isLoggedIn();
        console.log('AuthProvider: Initial auth check, logged in:', loggedIn);
        
        if (loggedIn) {
          const apiKey = getApiKey();
          if (apiKey) {
            console.log('AuthProvider: API key found, initializing API client');
            api.updateApiKey(apiKey);
            setApiInitialized(true);
            
            // Try to get cached user identity or validate the key
            const cachedIdentity = getCachedUserIdentity();
            if (cachedIdentity) {
              console.log('AuthProvider: Using cached user identity');
              setUserIdentity(cachedIdentity);
              setIsAuthenticated(true);
            } else {
              console.log('AuthProvider: Validating API key on mount');
              try {
                const identity = await validateApiKey();
                console.log('AuthProvider: API key valid, user:', identity.email);
                setCachedUserIdentity(identity);
                setUserIdentity(identity);
                setIsAuthenticated(true);
              } catch (error) {
                console.warn('AuthProvider: API key validation failed on mount:', error);
                // Clear invalid credentials
                clearApiKey();
                invalidateUserIdentityCache();
                setIsAuthenticated(false);
                setApiInitialized(false);
              }
            }
          } else {
            console.warn('AuthProvider: No API key found despite logged in status');
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('AuthProvider: Error initializing auth:', error);
        setIsAuthenticated(false);
        setApiInitialized(false);
      } finally {
        // Mark auth as ready, regardless of result
        setIsAuthReady(true);
      }
    };

    initAuth();
  }, []);

  // Redirect to login if not authenticated and not on login page.
  // Normalize pathname for trailingSlash (e.g. /login vs /login/) to avoid redirect loop.
  const isLoginPage = pathname === '/login' || pathname === '/login/';
  useEffect(() => {
    if (isAuthReady && !isAuthenticated && !isLoginPage) {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthReady, isLoginPage, router]);

  const login = async (apiKey: string): Promise<void> => {
    // First, update the API client with the key (needed for validation)
    api.updateApiKey(apiKey);
    
    // Validate the API key by calling /api/me
    try {
      const identity = await validateApiKey();
      console.log('AuthProvider: API key validated successfully, user:', identity.email);
      
      // Key is valid, store it
      setApiKey(apiKey);
      
      // Cache user identity
      setCachedUserIdentity(identity);
      setUserIdentity(identity);
      
      // Update authentication state
      setApiInitialized(true);
      setIsAuthenticated(true);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      // Validation failed, clear the API client and throw error
      api.updateApiKey('');
      console.error('AuthProvider: API key validation failed:', error);
      throw error; // Re-throw so login page can show the error
    }
  };

  const logout = useCallback((): void => {
    // Clear the API key
    clearApiKey();
    api.updateApiKey('');
    
    // Clear user identity cache
    invalidateUserIdentityCache();
    setUserIdentity(null);
    
    // Clear tenant settings cache so next login gets fresh data
    invalidateTenantSettingsCache();

    // Clear all in-memory service caches so account switch cannot reuse old tenant data
    invalidateCampaignCaches();
    invalidateZoneCaches();
    invalidateStatsCache();
    invalidateConversionsCache();
    invalidateTargetingRuleTypesCache();
    
    // Update authentication state
    setIsAuthenticated(false);
    setApiInitialized(false);
    
    // Redirect to login
    router.push('/login');
  }, [router]);

  // Add a global error handler for API authentication errors
  useEffect(() => {
    const handleApiErrors = (event: ErrorEvent) => {
      // Check if the error is related to invalid/expired API key
      if (
        event.error &&
        typeof event.error.message === 'string' &&
        (event.error.message.includes('API key is invalid') || 
         event.error.message.includes('API key is expired'))
      ) {
        console.error('AuthProvider: Detected invalid API key, logging out');
        // Logout the user when an invalid token is detected
        logout();
      }
    };

    // Add the global error handler
    window.addEventListener('error', handleApiErrors);
    
    // Cleanup
    return () => {
      window.removeEventListener('error', handleApiErrors);
    };
  }, [logout]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      apiInitialized, 
      isAuthReady,
      userIdentity
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 
