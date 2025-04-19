'use client';

import React from 'react';
import { useAuth } from '@/components/auth-provider';

interface WithAuthGuardProps {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

/**
 * Higher-order component that only renders children when authentication is ready
 * This prevents premature data fetching before auth is established
 */
export function WithAuthGuard({ 
  children, 
  loadingComponent = <div className="p-8 text-center">Loading...</div> 
}: WithAuthGuardProps) {
  const { isAuthReady, isAuthenticated, apiInitialized } = useAuth();

  // Show loading state if auth is not yet ready
  if (!isAuthReady) {
    return loadingComponent;
  }

  // If auth is ready but user is not authenticated or API is not initialized,
  // we'll let the AuthProvider handle the redirect to login
  if (!isAuthenticated || !apiInitialized) {
    return loadingComponent;
  }

  // Auth is ready and user is authenticated, render children
  return <>{children}</>;
} 