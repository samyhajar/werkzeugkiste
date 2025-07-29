import * as React from "react"
import { cn } from "@/lib/utils"

interface CustomInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const CustomInput = React.forwardRef<HTMLInputElement, CustomInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "h-14 rounded-2xl border-2 border-gray-100 bg-gray-50/50 focus:border-[#486681] focus:bg-white focus:ring-4 focus:ring-[#486681]/10 transition-all duration-200 text-gray-800 placeholder:text-gray-400 font-medium w-full px-4",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

CustomInput.displayName = "CustomInput"

export { CustomInput }