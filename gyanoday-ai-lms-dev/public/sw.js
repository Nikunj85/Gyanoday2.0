/* Gyanoday AI — service worker for streak-reminder push notifications.
 * Must live at <project root>/public/sw.js so it is served from https://<site>/sw.js
 * (it is registered with scope "/" in services/push-notification-service.ts).
 */

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Payload is sent by sendStreakReminders(): { title, body, url }
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { body: event.data ? event.data.text() : '' }
  }

  const title = data.title || 'Gyanoday AI'
  const options = {
    body: data.body || 'Time for a quick study session!',
    icon: data.icon || '/favicon.ico',
    data: { url: data.url || '/dashboard' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// Tapping the notification focuses an open tab, or opens the app.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = (event.notification.data && event.notification.data.url) || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(target)
          return client.focus()
        }
      }
      return self.clients.openWindow(target)
    })
  )
})
