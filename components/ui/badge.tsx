import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary ring-primary/20",
        secondary: "bg-secondary/10 text-secondary ring-secondary/20",
        destructive: "bg-destructive/10 text-destructive ring-destructive/20",
        outline: "bg-background text-foreground ring-input",
        active: "bg-green-100 text-green-800 ring-green-200 dark:bg-green-900 dark:text-green-300 dark:ring-green-800/30",
        inactive: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:ring-amber-800/30",
        paused: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900 dark:text-amber-300 dark:ring-amber-800/30",
        completed: "bg-blue-100 text-blue-800 ring-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:ring-blue-800/30",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.25 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      radius: {
        default: "rounded-full",
        sm: "rounded-md",
        lg: "rounded-lg",
        none: "rounded-none",
      },
      highContrast: {
        true: "font-medium",
        false: "",
      }
    },
    compoundVariants: [
      {
        variant: "default",
        highContrast: true,
        className: "bg-primary/15 text-primary-foreground ring-primary/30",
      },
      {
        variant: "secondary",
        highContrast: true,
        className: "bg-secondary/15 text-secondary-foreground ring-secondary/30",
      },
      {
        variant: "destructive",
        highContrast: true,
        className: "bg-destructive/15 text-destructive-foreground ring-destructive/30",
      },
      {
        variant: "active",
        highContrast: true,
        className: "bg-green-200 text-green-900 ring-green-300 dark:bg-green-800 dark:text-green-200 dark:ring-green-700",
      },
      {
        variant: "inactive",
        highContrast: true,
        className: "bg-amber-200 text-amber-900 ring-amber-300 dark:bg-amber-800 dark:text-amber-200 dark:ring-amber-700",
      },
      {
        variant: "paused",
        highContrast: true,
        className: "bg-amber-200 text-amber-900 ring-amber-300 dark:bg-amber-800 dark:text-amber-200 dark:ring-amber-700",
      },
      {
        variant: "completed",
        highContrast: true,
        className: "bg-blue-200 text-blue-900 ring-blue-300 dark:bg-blue-800 dark:text-blue-200 dark:ring-blue-700",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
      radius: "default",
      highContrast: false,
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

function Badge({ 
  className, 
  variant, 
  size, 
  radius,
  highContrast,
  asChild = false,
  ...props 
}: BadgeProps) {
  const Comp = asChild ? React.Fragment : "div"
  return (
    <Comp 
      className={cn(badgeVariants({ variant, size, radius, highContrast }), className)} 
      {...props} 
    />
  )
}

export { Badge, badgeVariants } 