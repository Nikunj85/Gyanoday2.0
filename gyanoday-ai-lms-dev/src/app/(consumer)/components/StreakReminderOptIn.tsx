'use client'

import { Bell, BellOff, BellRing, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

import { pushNotificationService } from '@/services/push-notification-service'

/**
 * Lets a student opt in to gentle push reminders if they haven't studied
 * yet today. Self-contained — checks support/permission state on mount,
 * hides itself entirely on unsupported browsers or once already enabled
 * (except for a small "reminders on" pill), and never blocks the rest of
 * the dashboard from rendering.
 */
export function StreakReminderOptIn() {
  const [status, setStatus] = useState<'checking' | 'unsupported' | 'off' | 'on' | 'denied'>(
    'checking'
  )
  const [isWorking, setIsWorking] = useState(false)

  useEffect(() => {
    ;(async () => {
      if (!pushNotificationService.isSupported()) {
        setStatus('unsupported')
        return
      }
      const permission = await pushNotificationService.getPermissionState()
      if (permission === 'denied') {
        setStatus('denied')
        return
      }
      const enabled = await pushNotificationService.isEnabled()
      setStatus(enabled ? 'on' : 'off')
    })()
  }, [])

  const handleEnable = async () => {
    setIsWorking(true)
    try {
      const ok = await pushNotificationService.enable()
      setStatus(ok ? 'on' : 'off')
    } finally {
      setIsWorking(false)
    }
  }

  const handleDisable = async () => {
    setIsWorking(true)
    try {
      await pushNotificationService.disable()
      setStatus('off')
    } finally {
      setIsWorking(false)
    }
  }

  if (status === 'checking' || status === 'unsupported' || status === 'denied') return null

  if (status === 'on') {
    return (
      <button
        onClick={handleDisable}
        disabled={isWorking}
        className="group flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 rounded-full transition-all hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
        title="Turn off streak reminders"
      >
        {isWorking ? (
          <Loader2 size={13} className="animate-spin" />
        ) : (
          <BellRing size={13} className="group-hover:hidden" />
        )}
        {!isWorking && <BellOff size={13} className="hidden group-hover:block" />}
        <span>Reminders on</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleEnable}
      disabled={isWorking}
      className="flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full transition-all active:scale-95"
      title="Get a gentle nudge if you haven't studied yet today"
    >
      {isWorking ? <Loader2 size={13} className="animate-spin" /> : <Bell size={13} />}
      <span>Remind me daily</span>
    </button>
  )
}
