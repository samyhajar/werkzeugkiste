"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CheckboxProps {
  id?: string
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ id, checked = false, onCheckedChange, disabled = false, className = "", ...props }, ref) => {
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "h-4 w-4 border border-gray-300 rounded-sm flex items-center justify-center",
          "focus:outline-none focus:ring-2 focus:ring-[#486681] focus:ring-offset-2",
          "transition-colors duration-200",
          checked
            ? "bg-[#486681] border-[#486681] text-white"
            : "bg-white hover:bg-gray-50",
          disabled
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer",
          className
        )}
        {...props}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </button>
    )
  }
)

Checkbox.displayName = "Checkbox"

export { Checkbox }