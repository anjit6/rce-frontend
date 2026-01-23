import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

const selectVariants = cva(
  "flex w-full items-center justify-between rounded-md border bg-background text-sm placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors appearance-none cursor-pointer",
  {
    variants: {
      variant: {
        default: "border-gray-300 focus:border-red-500",
        error: "border-red-500 focus:border-red-500",
      },
      selectSize: {
        sm: "h-9 px-3 py-2 text-sm",
        default: "h-10 px-3 py-2 text-sm",
        lg: "h-11 px-3 py-2 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      selectSize: "default",
    },
  }
)

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
  VariantProps<typeof selectVariants> {
  icon?: boolean
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, variant, selectSize, icon = true, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          className={cn(selectVariants({ variant, selectSize, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </select>
        {icon && (
          <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
        )}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
