"use client";

import { CreditCard } from "lucide-react";
import { useUserIdentity } from "@/lib/use-user-identity";

export default function BillingPage() {
  const { role } = useUserIdentity();

  if (role != null && role !== "owner") {
    return (
      <div className="container mx-auto min-w-0 max-w-full p-6">
        <h1 className="mb-6 text-2xl font-bold md:text-3xl">Billing</h1>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-6">
          <p className="text-sm text-destructive">
            Only owners can access billing.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Billing</h1>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-12 px-6 text-center max-w-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <CreditCard className="h-6 w-6" />
        </div>
        <p className="text-lg font-medium text-foreground mb-1">Coming soon</p>
        <p className="text-muted-foreground text-sm max-w-sm">
          Invoices and usage detalisation will be available here.
        </p>
      </div>
    </div>
  );
}
