"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, BarChart3, Layers, Users, ChevronDown, Settings, LogOut, CircleUser, CreditCard, UserPlus, Key, MousePointerClick } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/components/auth-provider";
import { TenantDocumentTitle } from "@/components/tenant-document-title";
import { useTenantSettings } from "@/lib/use-tenant-settings";
import { getNamespace } from "@/lib/api";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [accountDropdownMounted, setAccountDropdownMounted] = useState(false);
  const pathname = usePathname();
  const { logout, userIdentity, isAuthReady, isAuthenticated } = useAuth();
  const { company, isLoading: tenantLoading } = useTenantSettings();
  const role = userIdentity?.role ?? null;
  const isOwner = role === "owner";
  const canAccessTeam = role === "owner" || role === "manager";

  useEffect(() => setAccountDropdownMounted(true), []);

  // Display name: tenant company/brand from settings, or namespace as-is (no placeholder, no capitalization)
  useEffect(() => {
    if (tenantLoading) return;
    if (company) {
      setDisplayName(company);
    } else {
      setDisplayName(getNamespace() ?? "");
    }
  }, [company, tenantLoading]);
  
  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Navigation items (Zones hidden for advertiser; Campaigns hidden for publisher)
  const allNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Campaigns", href: "/campaigns", icon: Layers },
    { name: "Zones", href: "/zones", icon: Users },
    { name: "Statistics", href: "/stats", icon: BarChart3 },
    { name: "Conversions", href: "/conversions", icon: MousePointerClick },
  ];
  const navItems = allNavItems.filter((item) => {
    if (item.href === "/zones" && role === "advertiser") return false;
    if (item.href === "/campaigns" && role === "publisher") return false;
    return true;
  });

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <div className="flex min-h-screen min-w-0 overflow-x-hidden bg-background">
      <TenantDocumentTitle />
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — glass blur, active pill (primary 15%), tight icon+text alignment */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border/50 bg-card/80 backdrop-blur-md transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <span className="text-xl font-bold">{displayName ?? getNamespace() ?? "Loading..."}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="space-y-0.5 px-2 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="h-[1.125rem] w-[1.125rem] shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 w-full px-4 flex items-center">
          <ThemeToggle />
        </div>
      </div>

      {/* Main content — min-w-0 so column shrinks to viewport and table scrolls inside */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top navigation */}
        <header className="h-16 border-b bg-card">
          <div className="flex h-full items-center px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="mr-2 md:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div className="ml-auto flex items-center">
              {!accountDropdownMounted ? (
                <Button variant="ghost" size="sm" className="gap-1.5">
                  <CircleUser className="h-4 w-4 shrink-0" />
                  <span className="max-w-[140px] truncate sm:max-w-[200px]">{userIdentity?.email}</span>
                  <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
                </Button>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-1.5">
                      <CircleUser className="h-4 w-4 shrink-0" />
                      <span 
                        className="max-w-[140px] truncate sm:max-w-[200px]" 
                        title={userIdentity?.email || 'No email available'}
                      >
                        {userIdentity?.email || (userIdentity ? 'Account' : 'Loading...')}
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {isOwner && (
                      <DropdownMenuItem asChild>
                        <Link href="/settings" className="flex items-center gap-2 cursor-pointer">
                          <Settings className="h-4 w-4" />
                          Platform Settings
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {isOwner && (
                      <DropdownMenuItem asChild>
                        <Link href="/billing" className="flex items-center gap-2 cursor-pointer">
                          <CreditCard className="h-4 w-4" />
                          Billing
                        </Link>
                      </DropdownMenuItem>
                    )}
                    {canAccessTeam && (
                      <DropdownMenuItem asChild>
                        <Link href="/team" className="flex items-center gap-2 cursor-pointer">
                          <UserPlus className="h-4 w-4" />
                          Team
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/api" className="flex items-center gap-2 cursor-pointer">
                        <Key className="h-4 w-4" />
                        API
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        {/* Page content - min-w-0 allows flex child to shrink so table overflow scroll works */}
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
} 