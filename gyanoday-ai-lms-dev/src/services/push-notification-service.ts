'use client'

import { removePushSubscription, savePushSubscription } from '@/app/actions/notification-actions'

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export const pushNotificationService = {
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
    )
  },

  async getPermissionState(): Promise<NotificationPermission | 'unsupported'> {
    if (!this.isSupported()) return 'unsupported'
    return Notification.permission
  },

  async enable(): Promise<boolean> {
    if (!this.isSupported()) return false

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return false

    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!publicKey) {
      console.warn('[pushNotificationService] NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set.')
      return false
    }

    const registration = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    let subscription = await registration.pushManager.getSubscription()
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
    }

    await savePushSubscription(subscription.toJSON() as PushSubscriptionJSON)
    return true
  },

  async disable(): Promise<void> {
    if (!this.isSupported()) return
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    const subscription = await registration?.pushManager.getSubscription()
    if (subscription) {
      await removePushSubscription(subscription.endpoint)
      await subscription.unsubscribe()
    }
  },

  async isEnabled(): Promise<boolean> {
    if (!this.isSupported()) return false
    const registration = await navigator.serviceWorker.getRegistration('/sw.js')
    const subscription = await registration?.pushManager.getSubscription()
    return !!subscription
  },
}