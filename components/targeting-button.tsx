'use client';

import { ReactNode } from 'react';
import { cn } from "@/lib/utils";
import { toggleVariants } from "@/components/ui/toggle";

interface TargetingButtonProps {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  indicator?: 'green' | 'red';
  className?: string;
}

export function TargetingButton({
  active,
  onClick,
  disabled = false,
  children,
  indicator,
  className
}: TargetingButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        toggleVariants({ 
          variant: active ? "default" : "outline", 
          size: "default" 
        }),
        "data-[state=on]:bg-accent data-[state=on]:text-accent-foreground",
        active && "data-[state=on]:bg-accent",
        "flex items-center gap-2",
        className
      )}
      onClick={onClick}
      disabled={disabled}
      data-state={active ? "on" : "off"}
    >
      {children}
      {active && indicator && (
        <span className={`inline-block h-2 w-2 rounded-full ${indicator === 'green' ? 'bg-green-500' : 'bg-red-500'}`}></span>
      )}
    </button>
  );
} 