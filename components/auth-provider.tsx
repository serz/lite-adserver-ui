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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [apiInitialized, setApiInitialized] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if the user is authenticated on mount and initialize API
    const loggedIn = isLoggedIn();
    setIsAuthenticated(loggedIn);
    
    if (loggedIn) {
      const apiKey = getApiKey();
      if (apiKey) {
        api.updateApiKey(apiKey);
        setApiInitialized(true);
      }
    }
  }, []);

  // Redirect to login if not authenticated and not on login page
  useEffect(() => {
    if (!isAuthenticated && pathname !== '/login') {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router]);

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

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, apiInitialized }}>
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