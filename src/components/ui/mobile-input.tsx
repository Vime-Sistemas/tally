import * as React from "react"
import { cn } from "@/lib/utils"

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  prefix?: string
  suffix?: string
}

export const MobileInput = React.forwardRef<HTMLInputElement, MobileInputProps>(
  ({ className, label, error, prefix, suffix, type, onBlur, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    // Combine refs
    React.useImperativeHandle(ref, () => inputRef.current!)

    // Handle blur to close keyboard on iOS
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Force blur to close keyboard
      if (inputRef.current) {
        inputRef.current.blur()
      }
      onBlur?.(e)
    }

    // Handle "Done" button on iOS keyboard
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        inputRef.current?.blur()
      }
    }

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <div className={cn(
          "flex items-center bg-white rounded-xl border transition-colors",
          error ? "border-red-300" : "border-gray-200",
          "focus-within:border-gray-400"
        )}>
          {prefix && (
            <span className="pl-4 text-gray-500 font-medium select-none">
              {prefix}
            </span>
          )}
          <input
            ref={inputRef}
            type={type}
            className={cn(
              "flex-1 px-4 py-4 bg-transparent text-base text-gray-900 placeholder:text-gray-400",
              "focus:outline-none",
              "appearance-none",
              "[&::-webkit-outer-spin-button]:appearance-none",
              "[&::-webkit-inner-spin-button]:appearance-none",
              prefix && "pl-2",
              suffix && "pr-2",
              className
            )}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            enterKeyHint="done"
            {...props}
          />
          {suffix && (
            <span className="pr-4 text-gray-500 font-medium select-none">
              {suffix}
            </span>
          )}
        </div>
        {error && (
          <span className="text-sm text-red-500">{error}</span>
        )}
      </div>
    )
  }
)

MobileInput.displayName = "MobileInput"

// Currency Input with better mobile UX
interface MobileCurrencyInputProps extends Omit<MobileInputProps, 'type' | 'prefix'> {
  value?: number
  onValueChange?: (value: number) => void
}

export const MobileCurrencyInput = React.forwardRef<HTMLInputElement, MobileCurrencyInputProps>(
  ({ label, error, value, onValueChange, onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^\d]/g, '')
      const numericValue = parseFloat(rawValue) / 100
      onValueChange?.(numericValue)
      onChange?.(e)
    }

    const displayValue = value !== undefined 
      ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : ''

    return (
      <MobileInput
        ref={ref}
        type="text"
        inputMode="numeric"
        label={label}
        error={error}
        prefix="R$"
        value={displayValue}
        onChange={handleChange}
        placeholder="0,00"
        {...props}
      />
    )
  }
)

MobileCurrencyInput.displayName = "MobileCurrencyInput"

// Date Input that opens native picker
interface MobileDateInputProps extends Omit<MobileInputProps, 'type'> {
  value?: string
  onValueChange?: (value: string) => void
}

export const MobileDateInput = React.forwardRef<HTMLInputElement, MobileDateInputProps>(
  ({ label, error, value, onValueChange, onChange, ...props }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null)
    
    React.useImperativeHandle(ref, () => inputRef.current!)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onValueChange?.(e.target.value)
      onChange?.(e)
    }

    // Format date for display
    const displayDate = value 
      ? new Date(value + 'T12:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })
      : ''

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-gray-700">{label}</label>
        )}
        <div className="relative">
          <button
            type="button"
            onClick={() => inputRef.current?.showPicker?.()}
            className={cn(
              "w-full flex items-center justify-between px-4 py-4 bg-white rounded-xl border transition-colors text-left",
              error ? "border-red-300" : "border-gray-200",
              "active:bg-gray-50"
            )}
          >
            <span className={cn(
              "text-base",
              value ? "text-gray-900" : "text-gray-400"
            )}>
              {displayDate || "Selecionar data"}
            </span>
            <svg
              className="h-5 w-5 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <input
            ref={inputRef}
            type="date"
            value={value}
            onChange={handleChange}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            {...props}
          />
        </div>
        {error && (
          <span className="text-sm text-red-500">{error}</span>
        )}
      </div>
    )
  }
)

MobileDateInput.displayName = "MobileDateInput"
