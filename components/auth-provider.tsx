"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getApiKey, setApiKey, clearApiKey, isLoggedIn } from '@/lib/auth';
import { api } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (apiKey: string) => Promise<void>;
  logout: () => void;
  apiInitialized: boolean;
  isAuthReady: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [apiInitialized, setApiInitialized] = useState<boolean>(false);
  const [isAuthReady, setIsAuthReady] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if the user is authenticated on mount and initialize API
    const initAuth = async () => {
      try {
        const loggedIn = isLoggedIn();
        console.log('AuthProvider: Initial auth check, logged in:', loggedIn);
        setIsAuthenticated(loggedIn);
        
        if (loggedIn) {
          const apiKey = getApiKey();
          if (apiKey) {
            console.log('AuthProvider: API key found, initializing API client');
            api.updateApiKey(apiKey);
            setApiInitialized(true);
          } else {
            console.warn('AuthProvider: No API key found despite logged in status');
            // Clear logged in state if we have no API key
            setIsAuthenticated(false);
          }
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

  // Redirect to login if not authenticated and not on login page
  useEffect(() => {
    if (isAuthReady && !isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, isAuthReady, pathname, router]);

  const login = async (apiKey: string): Promise<void> => {
    // Store the API key
    setApiKey(apiKey);
    
    // Update the API client
    api.updateApiKey(apiKey);
    setApiInitialized(true);

    // Update authentication state
    setIsAuthenticated(true);

    // Redirect to dashboard
    router.push('/dashboard');
  };

  const logout = (): void => {
    // Clear the API key
    clearApiKey();
    
    // Update authentication state
    setIsAuthenticated(false);
    setApiInitialized(false);
    
    // Redirect to login
    router.push('/login');
  };

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
      isAuthReady 
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