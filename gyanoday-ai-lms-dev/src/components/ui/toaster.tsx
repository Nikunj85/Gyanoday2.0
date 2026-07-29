'use client'

// Inspired by react-hot-toast library
import * as React from 'react'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProps,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="flex flex-col gap-1 pr-2">
              {title && <ToastTitle className="text-sm font-bold">{title}</ToastTitle>}
              {description && (
                <ToastDescription className="text-xs text-slate-500 font-medium">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
