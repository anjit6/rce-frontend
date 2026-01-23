import * as React from "react"
import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CustomSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  selectSize?: 'sm' | 'default' | 'lg'
  variant?: 'default' | 'error'
  options?: Array<{ value: string; label: string }>
}

const CustomSelect = React.forwardRef<HTMLDivElement, CustomSelectProps>(
  ({ className, selectSize = 'default', variant = 'default', value, onChange, options = [], children, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedValue, setSelectedValue] = useState(value || '')
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
    const containerRef = useRef<HTMLDivElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)
    const buttonRef = useRef<HTMLButtonElement>(null)

    // Parse options from children if not provided as prop
    const selectOptions = options.length > 0 ? options : React.Children.toArray(children)
      .filter((child): child is React.ReactElement => React.isValidElement(child))
      .map((child) => ({
        value: child.props.value,
        label: child.props.children
      }))

    const selectedLabel = selectOptions.find(opt => opt.value === selectedValue)?.label || 'Select...'

    // Height classes based on size
    const sizeClasses = {
      sm: 'h-9 text-sm',
      default: 'h-10 text-sm',
      lg: 'h-11 text-base'
    }

    // Variant classes
    const variantClasses = {
      default: 'border-gray-300 focus:border-red-500',
      error: 'border-red-500 focus:border-red-500'
    }

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          containerRef.current && !containerRef.current.contains(event.target as Node) &&
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Calculate dropdown position when opened
    useEffect(() => {
      if (isOpen && buttonRef.current) {
        const updatePosition = () => {
          if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect()
            setDropdownPosition({
              top: rect.bottom + 4,
              left: rect.left,
              width: rect.width
            })
          }
        }

        updatePosition()
      }
    }, [isOpen])

    // Update position on scroll/resize
    useEffect(() => {
      if (!isOpen) return

      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect()
          setDropdownPosition({
            top: rect.bottom + 4,
            left: rect.left,
            width: rect.width
          })
        }
      }

      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)

      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }, [isOpen])

    const handleToggle = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsOpen(!isOpen)
    }

    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue)
      setIsOpen(false)

      // Trigger onChange event
      if (onChange) {
        const syntheticEvent = {
          target: { value: optionValue },
          currentTarget: { value: optionValue }
        } as React.ChangeEvent<HTMLSelectElement>
        onChange(syntheticEvent)
      }
    }

    return (
      <>
        <div ref={containerRef} className="relative w-full">
          {/* Select Button */}
          <button
            ref={buttonRef}
            type="button"
            onClick={handleToggle}
            onMouseDown={(e) => e.preventDefault()}
            className={cn(
              "flex w-full items-center justify-between rounded-md border bg-white px-3 py-2 transition-colors appearance-none cursor-pointer focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
              sizeClasses[selectSize],
              variantClasses[variant],
              isOpen && "border-red-500",
              className
            )}
            {...props}
          >
            <span className="truncate">{selectedLabel}</span>
            <ChevronDown className={cn(
              "h-4 w-4 opacity-50 transition-transform flex-shrink-0 ml-2",
              isOpen && "transform rotate-180"
            )} />
          </button>
        </div>

        {/* Dropdown Options - Rendered as Portal */}
        {isOpen && createPortal(
          <div
            ref={dropdownRef}
            className="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
            style={{
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`
            }}
          >
            {selectOptions.map((option) => (
              <div
                key={option.value}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSelect(option.value)
                }}
                className={cn(
                  "px-3 py-2 cursor-pointer transition-colors",
                  selectedValue === option.value
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {option.label}
              </div>
            ))}
          </div>,
          document.body
        )}
      </>
    )
  }
)

CustomSelect.displayName = "CustomSelect"

export { CustomSelect }
