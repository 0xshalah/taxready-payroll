import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        "primary-green":
          "bg-primary text-primary-foreground rounded-lg hover:bg-primary-deep dark:bg-gradient-to-r dark:from-primary dark:to-primary-cyan dark:hover:shadow-glow font-semibold",
        "secondary-outline":
          "border border-hairline-strong bg-canvas-card text-ink rounded-lg hover:bg-canvas-elevated dark:hover:border-primary/30",
        danger:
          "bg-error text-white rounded-lg hover:bg-error/90 dark:hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]",
        link:
          "text-primary underline-offset-4 hover:underline bg-transparent",
        default:
          "bg-primary text-primary-foreground rounded-lg hover:bg-primary-deep dark:bg-gradient-to-r dark:from-primary dark:to-primary-cyan dark:hover:shadow-glow font-semibold",
        outline:
          "border border-hairline-strong bg-canvas-card text-ink rounded-lg hover:bg-canvas-elevated dark:hover:border-primary/30",
        secondary:
          "bg-canvas-elevated text-ink rounded-lg hover:bg-canvas-soft",
        ghost:
          "hover:bg-canvas-elevated hover:text-ink rounded-lg",
      },
      size: {
        default: "h-11 px-4 py-2",   // 44px — Apple HIG minimum touch target
        sm: "h-9 px-3 text-xs",       // 36px — acceptable for secondary actions
        lg: "h-12 px-6",              // 48px — Material Design recommended
        icon: "h-11 w-11",            // 44px square touch target
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
