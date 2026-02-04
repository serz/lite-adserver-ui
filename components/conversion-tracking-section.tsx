"use client";

import { getApiUrl } from "@/lib/api";
import { CopyableChip } from "@/components/ui/copyable-chip";

const MACROS = ["{click_id}", "{zone_id}", "{aff_sub_id}"] as const;

/**
 * Shared conversion tracking info: supported macros, postback URL, optional query params, optimization.
 * Used in Redirect URL help (campaign forms) and on the API page.
 */
export function ConversionTrackingSection() {
  const postbackBase = getApiUrl().replace(/\/$/, "");
  const postbackUrl = `${postbackBase}/px/{click_id}`;

  return (
    <div className="rounded-md border border-border bg-muted/30 p-3 space-y-3 text-xs text-muted-foreground">
      <div>
        <p className="font-medium text-foreground mb-1.5">Supported macros</p>
        <p className="mb-2">Add these macros to your redirect URL — they will be automatically replaced when a user clicks your ad:</p>
        <div className="flex flex-wrap gap-2">
          {MACROS.map((macro) => (
            <CopyableChip key={macro} text={macro} />
          ))}
        </div>
      </div>
      <div>
        <p className="font-medium text-foreground mb-1.5">Conversion tracking</p>
        <p className="mb-1.5">
          To track conversions, include <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{"{click_id}"}</code> in your
          redirect URL. When a conversion happens (e.g. signup, purchase), send a request to:
        </p>
        <code className="block rounded bg-muted p-2 font-mono text-[11px] break-all">
          {postbackUrl}
        </code>
        <p className="mt-1.5">
          You may pass additional parameters to record conversion details (e.g.{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            ?payout=5&type=deposit
          </code>
          ). Example:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] break-all">
            {postbackUrl}?payout=5&type=deposit
          </code>
        </p>
        <div className="mt-2 rounded bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 px-2 py-1.5">
          <p className="text-blue-900 dark:text-blue-200">
            <strong>Note:</strong> Affset uses click-based (post-click) attribution. Conversions are attributed at the time of the original click, not at the time the conversion occurs.
          </p>
        </div>
      </div>
      <div>
        <p className="font-medium text-foreground mb-1">Optimization</p>
        <p>
          Use <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{"{zone_id}"}</code> and{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{"{aff_sub_id}"}</code> in your URL
          to analyze performance by placement or sub-id and optimize your campaigns.
        </p>
      </div>
    </div>
  );
}
