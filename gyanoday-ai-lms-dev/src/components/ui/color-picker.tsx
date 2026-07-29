'use client'

import { useState } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  className?: string
}

export function ColorPicker({ value, onChange, label, className }: ColorPickerProps) {
  const [hexInput, setHexInput] = useState(value)

  const handleColorChange = (color: string) => {
    setHexInput(color)
    onChange(color)
  }

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hex = e.target.value
    setHexInput(hex)

    // Validate hex color
    if (/^#[0-9A-F]{6}$/i.test(hex)) {
      onChange(hex)
    }
  }

  return (
    <div className={cn('grid gap-2', className)}>
      {label && <Label className="admin-label">{label}</Label>}

      <div className="flex items-center gap-3">
        {/* Color Preview Circle */}
        <div
          className="h-12 w-12 rounded-full border-2 border-slate-200 shadow-sm transition-all hover:scale-105"
          style={{ backgroundColor: value }}
        />

        {/* Native Color Picker */}
        <div className="relative flex-1">
          <input
            type="color"
            value={value}
            onChange={(e) => handleColorChange(e.target.value)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="admin-input flex items-center justify-between cursor-pointer hover:border-primary/50 transition-colors">
            <span className="text-sm font-medium text-slate-700">{value.toUpperCase()}</span>
            <div className="flex items-center gap-2">
              <div
                className="h-6 w-6 rounded border border-slate-200"
                style={{ backgroundColor: value }}
              />
              <svg
                className="h-4 w-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Hex Input */}
        <Input
          type="text"
          value={hexInput}
          onChange={handleHexInputChange}
          placeholder="#6366f1"
          maxLength={7}
          className="admin-input w-28 font-mono text-sm"
        />
      </div>

      <p className="text-[10px] text-muted-foreground font-medium">
        Choose a theme color for this subject
      </p>
    </div>
  )
}
