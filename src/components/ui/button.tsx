import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ecf8e]/15 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        "primary-green":
          "bg-primary text-primary-foreground rounded-sm hover:bg-primary-deep",
        "secondary-outline":
          "border border-hairline-strong bg-canvas text-ink rounded-sm hover:bg-canvas-soft",
        danger:
          "bg-error text-white rounded-sm hover:bg-error/90",
        link:
          "text-ink underline-offset-4 hover:underline bg-transparent",
        default:
          "bg-primary text-primary-foreground rounded-sm hover:bg-primary-deep",
        outline:
          "border border-hairline-strong bg-canvas text-ink rounded-sm hover:bg-canvas-soft",
        secondary:
          "bg-canvas-soft text-ink rounded-sm hover:bg-canvas-soft/80",
        ghost:
          "hover:bg-canvas-soft hover:text-ink rounded-sm",
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
