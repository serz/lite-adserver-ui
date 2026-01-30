"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn } from "@/lib/auth";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard if logged in, otherwise to login
    if (isLoggedIn()) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [router]);

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