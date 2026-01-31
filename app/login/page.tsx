"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { isLoggedIn } from "@/lib/auth";
import { useTenantSettings } from "@/lib/use-tenant-settings";
import { getNamespace } from "@/lib/api";

export default function LoginPage() {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("Lite Adserver");
  const router = useRouter();
  const { login } = useAuth();
  const { company } = useTenantSettings();
  
  // Update display name after mount to avoid hydration mismatch
  useEffect(() => {
    if (company) {
      setDisplayName(company);
    } else {
      const namespace = getNamespace();
      if (namespace) {
        setDisplayName(namespace.charAt(0).toUpperCase() + namespace.slice(1).toLowerCase());
      }
    }
  }, [company]);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isLoggedIn()) {
      router.push("/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use the login function from the auth context
      await login(apiKey.trim());
      // The auth context will redirect to dashboard
    } catch (err) {
      setError("Failed to log in. Please check your API key and try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-24">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">{displayName}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your dashboard
          </p>
        </div>

        {error && (
          <div className="rounded-md bg-destructive/15 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              required
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !apiKey.trim()}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
} 