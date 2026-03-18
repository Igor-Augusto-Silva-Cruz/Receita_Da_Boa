import * as React from "react"
import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"
import { Loader2 } from "lucide-react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "glass"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", isLoading, children, disabled, ...props }, ref) => {
    
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "bg-primary text-primary-foreground shadow-md hover:bg-primary/90 shadow-primary/25",
      destructive: "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90 shadow-destructive/25",
      outline: "border-2 border-input bg-background hover:bg-accent hover:text-accent-foreground",
      secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      glass: "glass-panel text-foreground hover:bg-white/90 dark:hover:bg-black/50 shadow-sm"
    }

    const sizes = {
      default: "h-11 px-5 py-2",
      sm: "h-9 rounded-lg px-3",
      lg: "h-12 rounded-2xl px-8 text-base",
      icon: "h-11 w-11",
    }

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...(props as HTMLMotionProps<"button">)}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    )
  }
)
Button.displayName = "Button"

export { Button }
