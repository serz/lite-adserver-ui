"use client";

import DashboardLayout from "@/components/dashboard-layout";
import { TenantThemeApply } from "@/components/tenant-theme-apply";
import { WithAuthGuard } from "@/components/with-auth-guard";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      <TenantThemeApply />
      <WithAuthGuard
        loadingComponent={
          <div className="container mx-auto min-w-0 max-w-full p-6">
            <div className="h-20 animate-pulse rounded-md bg-muted" />
          </div>
        }
      >
        {children}
      </WithAuthGuard>
    </DashboardLayout>
  );
}
