"use client";

import { UserPlus } from "lucide-react";

export default function TeamPage() {
  return (
    <div className="container mx-auto min-w-0 max-w-full p-6">
      <h1 className="mb-6 text-2xl font-bold md:text-3xl">Team</h1>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30 py-12 px-6 text-center max-w-xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
          <UserPlus className="h-6 w-6" />
        </div>
        <p className="text-lg font-medium text-foreground mb-1">Coming soon</p>
        <p className="text-muted-foreground text-sm max-w-sm">
          You will be able to add advertisers and affiliates here.
        </p>
      </div>
    </div>
  );
}
