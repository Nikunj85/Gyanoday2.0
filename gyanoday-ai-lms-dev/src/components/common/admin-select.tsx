'use client'

import { ChevronDown } from 'lucide-react'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

interface AdminSelectProps {
  value?: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  className?: string
  disabled?: boolean
  emptyMessage?: string
}

export const AdminSelect = ({
  value,
  onValueChange,
  options,
  placeholder,
  className,
  disabled = false,
  emptyMessage = 'No options available',
}: AdminSelectProps) => {
  const [open, setOpen] = React.useState(false)

  // Find selected option label
  const selectedOption = options.find((opt) => opt.value === value)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || !options.length) return

    // If menu is closed, cycle value
    if (!open) {
      const currentIndex = options.findIndex((opt) => opt.value === value)
      if (e.key === 'ArrowDown') {
        const nextIndex = (currentIndex + 1) % options.length
        onValueChange(options[nextIndex].value)
        e.preventDefault()
      } else if (e.key === 'ArrowUp') {
        const prevIndex = (currentIndex - 1 + options.length) % options.length
        onValueChange(options[prevIndex].value)
        e.preventDefault()
      }
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'admin-input flex h-10 w-full items-center justify-between font-normal focus:ring-2 focus:ring-primary',
            className
          )}
          onKeyDown={handleKeyDown}
        >
          <span className="truncate flex items-center gap-2">
            {selectedOption?.icon && (
              <selectedOption.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
            <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
          </span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[--radix-dropdown-menu-trigger-width] min-w-[10rem] bg-white border-primary shadow-lg max-h-[200px] overflow-y-auto"
        align="start"
      >
        <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
          {options.length === 0 ? (
            <div className="px-4 py-2 text-sm text-muted-foreground text-center italic">
              {emptyMessage}
            </div>
          ) : (
            options.map((opt) => (
              <DropdownMenuRadioItem
                key={opt.value}
                value={opt.value}
                className="focus:bg-primary focus:text-white"
              >
                <div className="flex items-center gap-2">
                  {opt.icon && <opt.icon className="h-4 w-4 shrink-0" />}
                  <span>{opt.label}</span>
                </div>
              </DropdownMenuRadioItem>
            ))
          )}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
