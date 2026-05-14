import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-canvas-elevated text-ink-mute border border-hairline",
        success:
          "bg-success-bg text-success-foreground border border-success/20",
        warning:
          "bg-warning-bg text-warning-foreground border border-warning/20",
        error:
          "bg-error-bg text-error-foreground border border-error/20",
        role:
          "bg-canvas-elevated text-ink-mute border border-hairline",
        info:
          "bg-info-bg text-info-foreground border border-info/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
