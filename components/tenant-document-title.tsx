"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTenantSettings } from "@/lib/use-tenant-settings";

const DEFAULT_TITLE = "Adserver Dashboard";

/** Maps pathname to a short page label for the document title. */
function getPageLabel(pathname: string): string {
  if (!pathname || pathname === "/") return "Dashboard";
  if (pathname.startsWith("/campaigns/create")) return "New Campaign";
  if (pathname.startsWith("/campaigns/edit")) return "Edit Campaign";
  if (pathname.startsWith("/campaigns")) return "Campaigns";
  if (pathname.startsWith("/zones")) return "Zones";
  if (pathname.startsWith("/stats")) return "Statistics";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/billing")) return "Billing";
  if (pathname.startsWith("/team")) return "Team";
  if (pathname.startsWith("/api")) return "API";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  return "Dashboard";
}

/**
 * Sets document.title to "{Company} – {Page}" when tenant settings are loaded.
 * Used inside the authenticated app layout. Renders nothing.
 */
export function TenantDocumentTitle() {
  const pathname = usePathname();
  const { company } = useTenantSettings();
  const pageLabel = getPageLabel(pathname ?? "");

  useEffect(() => {
    const title = company ? `${company} – ${pageLabel}` : (pageLabel || DEFAULT_TITLE);
    document.title = title;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [company, pageLabel]);

  return null;
}
