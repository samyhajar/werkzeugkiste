"use client"

import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends React.ComponentProps<typeof ProgressPrimitive.Root> {
  variant?: "default" | "success" | "custom"
  size?: "default" | "sm" | "lg"
  progressColor?: string
}

function Progress({
  className,
  value,
  variant = "default",
  size = "default",
  progressColor,
  ...props
}: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "relative w-full overflow-hidden rounded-full",
        variant === "default" && "bg-primary/20",
        variant === "success" && "bg-green-200",
        variant === "custom" && "bg-gray-200",
        size === "sm" && "h-1",
        size === "default" && "h-2",
        size === "lg" && "h-3",
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(
          "h-full w-full flex-1 transition-all duration-300 ease-in-out",
          variant === "default" && "bg-primary",
          variant === "success" && "bg-green-500",
          variant === "custom" && progressColor ? "" : "bg-[#486681]"
        )}
        style={{
          transform: `translateX(-${100 - (value || 0)}%)`,
          backgroundColor: variant === "custom" && progressColor ? progressColor : undefined
        }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
