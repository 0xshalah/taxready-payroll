import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-normal transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-canvas-soft text-ink border border-hairline",
        success:
          "bg-[#ecfdf5] text-[#065f46]",
        warning:
          "bg-[#fffbeb] text-[#92400e]",
        error:
          "bg-[#fef2f2] text-[#991b1b]",
        role:
          "bg-canvas-soft text-ink-mute border border-hairline",
        info:
          "bg-[#eff6ff] text-[#1e40af]",
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
