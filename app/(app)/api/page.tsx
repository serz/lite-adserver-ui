"use client";

import { Key } from "lucide-react";
import { ConversionTrackingSection } from "@/components/conversion-tracking-section";
import { useUserIdentity } from "@/lib/use-user-identity";

export default function ApiPage() {
  const { role } = useUserIdentity();
  const showConversionTracking = role !== "publisher";

  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">API</h1>
      <div className="max-w-xl space-y-6">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-12 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Key className="h-6 w-6" />
          </div>
          <p className="text-lg font-medium text-foreground mb-1">Coming soon</p>
          <p className="text-muted-foreground text-sm max-w-sm">
            API documentation and keys management will be available here.
          </p>
        </div>
        {showConversionTracking && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Conversion tracking</h2>
            <ConversionTrackingSection />
          </div>
        )}
      </div>
    </div>
  );
}
