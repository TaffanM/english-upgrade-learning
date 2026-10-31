import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors select-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-transparent shadow-2xs",
        secondary:
          "bg-secondary text-secondary-foreground border-border/60",
        destructive:
          "bg-destructive/10 text-destructive border-destructive/20",
        outline:
          "border-border/80 bg-card text-foreground",
        speaking:
          "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60",
        writing:
          "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
        cute:
          "bg-amber-100/70 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300/60 dark:border-amber-800/60",
        ghost: "hover:bg-muted text-muted-foreground border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
