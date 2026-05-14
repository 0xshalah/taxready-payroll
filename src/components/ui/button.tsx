import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        "primary-green":
          "bg-gradient-primary text-primary-foreground rounded-lg hover:shadow-glow btn-glow font-semibold",
        "secondary-outline":
          "border border-hairline-strong bg-canvas-card text-ink rounded-lg hover:bg-canvas-elevated hover:border-primary/30",
        danger:
          "bg-error/90 text-white rounded-lg hover:bg-error hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        link:
          "text-primary underline-offset-4 hover:underline bg-transparent",
        default:
          "bg-gradient-primary text-primary-foreground rounded-lg hover:shadow-glow btn-glow font-semibold",
        outline:
          "border border-hairline-strong bg-canvas-card text-ink rounded-lg hover:bg-canvas-elevated hover:border-primary/30",
        secondary:
          "bg-canvas-elevated text-ink rounded-lg hover:bg-canvas-soft/80",
        ghost:
          "hover:bg-canvas-elevated hover:text-ink rounded-lg",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 px-3 text-xs",
        lg: "h-10 px-6",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
