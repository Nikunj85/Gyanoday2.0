'use client'

import React from 'react'

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'

interface FormSidebarProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
}

export function FormSidebar({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
}: FormSidebarProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md bg-white border-l border-zinc-200 p-0 overflow-hidden flex flex-col shadow-2xl"
      >
        <SheetHeader className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <SheetTitle className="text-2xl font-bold text-zinc-900">{title}</SheetTitle>
          {description && (
            <SheetDescription className="text-zinc-500">{description}</SheetDescription>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-zinc-200">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  )
}
