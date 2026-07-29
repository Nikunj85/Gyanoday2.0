'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title?: string
  description?: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
  isPending?: boolean
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title = 'Are you absolutely sure?',
  description = 'This action cannot be undone. This will permanently delete the record and remove all associated data.',
  confirmText = 'Confirm Delete',
  cancelText = 'Cancel',
  variant = 'destructive',
  isPending = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-white border border-border text-foreground">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-primary">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-secondary/20 rounded-xl">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
            }}
            disabled={isPending}
            className={
              variant === 'destructive'
                ? 'bg-red-600 hover:bg-red-700 text-white rounded-xl'
                : 'admin-button-primary'
            }
          >
            {isPending ? 'Processing...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
