import * as React from "react"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "danger" | "glass"
  size?: "sm" | "default" | "lg" | "icon"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    
    const variants = {
      default: "bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
      secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90 hover:-translate-y-0.5 active:translate-y-0",
      outline: "border-2 border-border bg-transparent hover:border-primary hover:text-primary active:bg-primary/5",
      ghost: "hover:bg-muted text-foreground hover:text-primary",
      danger: "bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground",
      glass: "bg-white/20 backdrop-blur-md border border-white/30 text-foreground hover:bg-white/40 shadow-sm"
    }

    const sizes = {
      default: "h-11 px-5 py-2",
      sm: "h-9 rounded-lg px-3 text-sm",
      lg: "h-14 rounded-2xl px-8 text-lg",
      icon: "h-11 w-11 justify-center p-0",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 ease-out",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:opacity-50 disabled:pointer-events-none disabled:transform-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
