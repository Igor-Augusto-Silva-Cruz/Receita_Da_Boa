import * as React from "react"
import { cn } from "@/lib/utils"

interface UserAvatarProps {
  nome?: string | null
  photoUrl?: string | null
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
  xl: "w-32 h-32 text-5xl",
}

export function UserAvatar({ nome, photoUrl, size = "sm", className }: UserAvatarProps) {
  const [imgError, setImgError] = React.useState(false)
  const initial = nome?.charAt(0).toUpperCase() || "?"

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={nome ?? ""}
        onError={() => setImgError(true)}
        className={cn(
          "rounded-full object-cover flex-shrink-0",
          sizeClasses[size],
          className
        )}
        referrerPolicy="no-referrer"
      />
    )
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-primary-foreground font-bold flex-shrink-0 shadow-sm",
        sizeClasses[size],
        className
      )}
    >
      {initial}
    </div>
  )
}
