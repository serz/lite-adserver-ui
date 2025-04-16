"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, BarChart3, Layers, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { TimezoneToggle } from "@/components/timezone-toggle";
import { useAuth } from "@/components/auth-provider";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  
  // Close sidebar on route change on mobile
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Navigation items
  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Campaigns", href: "/dashboard/campaigns", icon: Layers },
    { name: "Zones", href: "/dashboard/zones", icon: Users },
    { name: "Statistics", href: "/dashboard/stats", icon: BarChart3 },
  ];

  const handleSignOut = (e: React.MouseEvent) => {
    e.preventDefault();
    logout();
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-card transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center">
            <span className="text-xl font-bold">Lite Adserver</span>
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
        <nav className="space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-4 w-full px-4 flex items-center space-x-2">
          <TimezoneToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col">
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
            <div className="ml-auto flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleSignOut}
              >
                Sign out
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
} 