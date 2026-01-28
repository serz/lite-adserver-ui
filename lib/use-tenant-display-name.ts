"use client";

import { useState, useEffect } from "react";
import { getTenantDisplayName } from "@/lib/api";

/**
 * Returns the tenant display name (namespace, first letter uppercase) for the current host.
 * Updates after mount so the value is correct in the browser.
 */
export function useTenantDisplayName(): string {
  const [name, setName] = useState("Lite Adserver");

  useEffect(() => {
    setName(getTenantDisplayName());
  }, []);

  return name;
}
