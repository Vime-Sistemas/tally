import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from "./drawer"

export interface PickerOption {
  value: string
  label: string
  group?: string
}

interface MobilePickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value?: string
  onValueChange: (value: string) => void
  options: PickerOption[]
  title?: string
  placeholder?: string
}

export function MobilePicker({
  open,
  onOpenChange,
  value,
  onValueChange,
  options,
  title = "Selecionar",
}: MobilePickerProps) {
  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue)
    onOpenChange(false)
  }

  // Group options if they have groups
  const groupedOptions = React.useMemo(() => {
    const groups: Record<string, PickerOption[]> = {}
    const ungrouped: PickerOption[] = []

    options.forEach(option => {
      if (option.group) {
        if (!groups[option.group]) {
          groups[option.group] = []
        }
        groups[option.group].push(option)
      } else {
        ungrouped.push(option)
      }
    })

    return { groups, ungrouped }
  }, [options])

  const hasGroups = Object.keys(groupedOptions.groups).length > 0

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] rounded-t-[32px] bg-white">
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        <DrawerDescription className="sr-only">Selecione uma opção</DrawerDescription>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-gray-500 text-base font-medium"
          >
            Cancelar
          </button>
          <span className="text-base font-semibold text-gray-900">{title}</span>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>

        {/* Options List */}
        <div className="overflow-y-auto max-h-[60vh] overscroll-contain">
          {hasGroups ? (
            <>
              {groupedOptions.ungrouped.length > 0 && (
                <div className="py-2">
                  {groupedOptions.ungrouped.map((option) => (
                    <PickerItem
                      key={option.value}
                      option={option}
                      selected={value === option.value}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              )}
              {Object.entries(groupedOptions.groups).map(([group, groupOptions]) => (
                <div key={group}>
                  <div className="px-6 py-2 bg-gray-50">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {group}
                    </span>
                  </div>
                  {groupOptions.map((option) => (
                    <PickerItem
                      key={option.value}
                      option={option}
                      selected={value === option.value}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ))}
            </>
          ) : (
            <div className="py-2">
              {options.map((option) => (
                <PickerItem
                  key={option.value}
                  option={option}
                  selected={value === option.value}
                  onSelect={handleSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Safe area padding */}
        <div className="h-8" />
      </DrawerContent>
    </Drawer>
  )
}

interface PickerItemProps {
  option: PickerOption
  selected: boolean
  onSelect: (value: string) => void
}

function PickerItem({ option, selected, onSelect }: PickerItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(option.value)}
      className={cn(
        "w-full flex items-center justify-between px-6 py-4 active:bg-gray-50 transition-colors",
        selected && "bg-gray-50"
      )}
    >
      <span className={cn(
        "text-base",
        selected ? "text-gray-900 font-medium" : "text-gray-700"
      )}>
        {option.label}
      </span>
      {selected && (
        <Check className="h-5 w-5 text-black" />
      )}
    </button>
  )
}

// Trigger component for consistency
interface MobilePickerTriggerProps {
  value?: string
  placeholder?: string
  options: PickerOption[]
  onClick: () => void
  label?: string
  error?: string
}

export function MobilePickerTrigger({
  value,
  placeholder = "Selecionar",
  options,
  onClick,
  label,
  error,
}: MobilePickerTriggerProps) {
  const selectedOption = options.find(o => o.value === value)

  return (
    <div className="space-y-2">
      {label && (
        <span className="text-sm font-medium text-gray-700">{label}</span>
      )}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "w-full flex items-center justify-between px-4 py-4 bg-white rounded-xl border transition-colors",
          error ? "border-red-300" : "border-gray-200",
          "active:bg-gray-50"
        )}
      >
        <span className={cn(
          "text-base",
          selectedOption ? "text-gray-900" : "text-gray-400"
        )}>
          {selectedOption?.label || placeholder}
        </span>
        <svg
          className="h-5 w-5 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {error && (
        <span className="text-sm text-red-500">{error}</span>
      )}
    </div>
  )
}
