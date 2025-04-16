"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getApiKey, setApiKey, clearApiKey, isLoggedIn } from '@/lib/auth';
import { api } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (apiKey: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Check if the user is authenticated on mount
    setIsAuthenticated(isLoggedIn());
  }, []);

  // Update API client with the current API key
  useEffect(() => {
    if (isAuthenticated) {
      const apiKey = getApiKey();
      if (apiKey) {
        api.updateApiKey(apiKey);
      }
    }
  }, [isAuthenticated]);

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
    
    // Redirect to login
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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