"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getApiUrl } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const MACROS = ["{click_id}", "{zone_id}", "{aff_sub_id}"] as const;

function CopyableChip({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({ title: "Copied", description: `${text} copied to clipboard` });
      setTimeout(() => setCopied(false), 1500);
    });
  }, [text, toast]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border border-input bg-muted/50 px-2 py-1 text-xs font-mono transition-colors hover:bg-muted",
        copied && "border-primary/50 bg-primary/10"
      )}
      title="Copy"
    >
      <span>{text}</span>
      {copied ? (
        <Check className="h-3 w-3 text-green-600" aria-hidden />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" aria-hidden />
      )}
    </button>
  );
}

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
        <p className="mb-2">Add these to your redirect URL; they will be replaced when the user clicks:</p>
        <div className="flex flex-wrap gap-2">
          {MACROS.map((macro) => (
            <CopyableChip key={macro} text={macro} />
          ))}
        </div>
      </div>
      <div>
        <p className="font-medium text-foreground mb-1.5">Conversion tracking</p>
        <p className="mb-1.5">
          Include <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{"{click_id}"}</code> in your
          redirect URL. When a conversion happens (e.g. signup, purchase), send a request to:
        </p>
        <code className="block rounded bg-muted p-2 font-mono text-[11px] break-all">
          {postbackUrl}
        </code>
        <p className="mt-1.5">
          You can add query parameters to store conversion details (e.g.{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            ?payout=5&type=deposit
          </code>
          ). Example:{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px] break-all">
            {postbackUrl}?payout=5&type=deposit
          </code>
        </p>
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
