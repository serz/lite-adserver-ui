"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/components/auth-provider";
import { isLoggedIn } from "@/lib/auth";
import { usePublicTenantSettings } from "@/lib/use-tenant-settings";
import { getNamespace } from "@/lib/api";
import { darkenHsl } from "@/lib/color-utils";

const DEFAULT_PRIMARY = "263 81% 58%";
const DEFAULT_PRIMARY_HOVER = "263 75% 50%";

function setLoginPageTheme(primaryHsl: string) {
  const root = document.documentElement;
  root.style.setProperty("--primary", primaryHsl);
  root.style.setProperty("--primary-hover", darkenHsl(primaryHsl, 8));
  root.style.setProperty("--glow-primary", `0 0 12px hsl(${primaryHsl} / 0.25)`);
}

function resetLoginPageTheme() {
  const root = document.documentElement;
  root.style.setProperty("--primary", DEFAULT_PRIMARY);
  root.style.setProperty("--primary-hover", DEFAULT_PRIMARY_HOVER);
  root.style.setProperty("--glow-primary", `0 0 12px hsl(${DEFAULT_PRIMARY} / 0.25)`);
}

export default function LoginPage() {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const router = useRouter();
  const { login } = useAuth();
  const { company, primaryColor } = usePublicTenantSettings();

  // Display name: tenant company/brand from settings, or namespace as-is (no placeholder, no capitalization)
  useEffect(() => {
    if (company) {
      setDisplayName(company);
    } else {
      setDisplayName(getNamespace() ?? "");
    }
  }, [company]);

  // Apply tenant primary color on login page; reset on unmount
  useEffect(() => {
    if (primaryColor) {
      setLoginPageTheme(primaryColor);
    }
    return () => resetLoginPageTheme();
  }, [primaryColor]);

  // Dynamic document title: "Company – Login" when tenant is loaded
  useEffect(() => {
    const title = company ? `${company} – Login` : "Login";
    document.title = title;
    return () => {
      document.title = "Adserver Dashboard";
    };
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
      // This will now validate the API key via /api/me before storing it
      await login(apiKey.trim());
      // The auth context will redirect to dashboard on success
    } catch (err) {
      // Show specific error message based on the error
      if (err instanceof Error) {
        if (err.message.includes('401') || err.message.includes('Unauthorized') || 
            err.message.includes('invalid') || err.message.includes('expired')) {
          setError("Invalid API key. Please check your key and try again.");
        } else if (err.message.includes('400') || err.message.includes('Bad Request')) {
          setError("Invalid request. Please try again.");
        } else if (err.message.includes('Network') || err.message.includes('Failed to fetch')) {
          setError("Network error. Please check your connection and try again.");
        } else {
          setError(err.message || "Failed to log in. Please check your API key and try again.");
        }
      } else {
        setError("Failed to log in. Please check your API key and try again.");
      }
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