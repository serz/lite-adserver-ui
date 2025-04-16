import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
        active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        inactive: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
        paused: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
        completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.25 text-xs",
        lg: "px-3 py-0.75 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants } 