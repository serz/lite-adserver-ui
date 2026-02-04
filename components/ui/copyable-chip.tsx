"use client";

import { useState, useCallback } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export function CopyableChip({ text }: { text: string }) {
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
