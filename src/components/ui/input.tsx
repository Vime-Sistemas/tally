import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-black placeholder:text-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors",
        className
      )}
      {...props}
    />
  )
}

Input.displayName = "Input"

export { Input }
