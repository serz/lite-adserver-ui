"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

export default function RootPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect when we're actually on the root path. Avoid redirecting when the server
    // served root HTML for a different URL (e.g. SPA fallback for /dashboard/campaigns/edit/13/).
    const isRoot = pathname === "/" || pathname === "";
    if (!isRoot) return;

    if (isLoggedIn()) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router, pathname]);

  // Show minimal loading state while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="mb-4 text-2xl font-bold">Lite Adserver</h1>
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
} 