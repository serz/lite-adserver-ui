"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { ConversionTrackingSection } from "@/components/conversion-tracking-section";

export function RedirectUrlHelp() {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">
        Users will be redirected to this URL when they click on your ad
      </p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
        aria-expanded={open}
      >
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span>Macros & conversion</span>
      </button>
      {open && <ConversionTrackingSection />}
    </div>
  );
}
