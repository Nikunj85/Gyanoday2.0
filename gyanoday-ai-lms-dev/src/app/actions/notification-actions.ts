'use server'

import webpush from 'web-push'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

let vapidConfigured = false
function ensureVapidConfigured() {
  if (vapidConfigured) return
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error(
      'Push notifications are not configured: NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY are missing.'
    )
  }
  webpush.setVapidDetails('mailto:support@gyanoday.app', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
  vapidConfigured = true
}

/**
 * Saves a browser push subscription for the currently authenticated user.
 *
 * The `notification_subscriptions` table only has a plain `device_token
 * text` column (no separate key columns), so the full PushSubscription
 * JSON (endpoint + p256dh/auth keys) is serialized into that column — the
 * subscription's `endpoint` is unique per browser/device, which is what
 * the table's (user_id, device_token) unique constraint is built around.
 */
export async function savePushSubscription(subscription: PushSubscriptionJSON) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')
  if (!subscription.endpoint) throw new Error('Invalid subscription')

  const { error } = await supabase.from('notification_subscriptions').upsert(
    {
      user_id: user.id,
      device_token: JSON.stringify(subscription),
      platform: 'web',
    },
    { onConflict: 'user_id,device_token' }
  )

  if (error) throw error
  return { success: true }
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // device_token stores the serialized subscription JSON, so we match by
  // substring on the endpoint rather than an exact equality check.
  const { error } = await supabase
    .from('notification_subscriptions')
    .delete()
    .eq('user_id', user.id)
    .like('device_token', `%${endpoint}%`)

  if (error) throw error
}

function getTodayStartISO() {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return now.toISOString()
}

/**
 * Gentle streak-reminder sweep — sends a push notification to every
 * active student who (a) has a saved push subscription and (b) hasn't
 * completed a quiz or a chapter yet today. Designed to be triggered once
 * a day, in the evening, by /api/cron/streak-reminders (see that route
 * for the cron schedule + secret).
 *
 * This intentionally does NOT try to be more aggressive than "you haven't
 * studied today yet" — no shaming language, no multiple pings, just one
 * gentle nudge per day.
 */
export async function sendStreakReminders() {
  ensureVapidConfigured()

  const todayStart = getTodayStartISO()

  const [{ data: todaysAttempts }, { data: todaysCompletions }, { data: subscriptions }] =
    await Promise.all([
      supabaseAdmin.from('quiz_attempts').select('user_id').gte('created_at', todayStart),
      supabaseAdmin
        .from('user_chapter_progress')
        .select('user_id')
        .eq('is_completed', true)
        .gte('completed_at', todayStart),
      supabaseAdmin
        .from('notification_subscriptions')
        .select('id, user_id, device_token, user:users!user_id(id, name, is_active, role)'),
    ])

  const activeToday = new Set<string>([
    ...(todaysAttempts || []).map((a: any) => a.user_id),
    ...(todaysCompletions || []).map((c: any) => c.user_id),
  ])

  const targets = (subscriptions || []).filter((sub: any) => {
    const user = sub.user
    if (!user || !user.is_active || user.role !== 'student') return false
    return !activeToday.has(sub.user_id)
  })

  let sent = 0
  let failed = 0
  const staleSubscriptionIds: string[] = []

  await Promise.all(
    targets.map(async (sub: any) => {
      let parsed: PushSubscriptionJSON
      try {
        parsed = JSON.parse(sub.device_token)
      } catch {
        staleSubscriptionIds.push(sub.id)
        return
      }

      const payload = JSON.stringify({
        title: "You haven't studied today yet 👀",
        body: `Keep your streak alive, ${sub.user?.name || 'friend'} — even one quick chapter counts.`,
        url: '/dashboard',
      })

      try {
        await webpush.sendNotification(parsed as any, payload)
        sent++
      } catch (err: any) {
        failed++
        // 404/410 means the browser subscription is gone for good — clean it up.
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          staleSubscriptionIds.push(sub.id)
        }
      }
    })
  )

  if (staleSubscriptionIds.length > 0) {
    await supabaseAdmin.from('notification_subscriptions').delete().in('id', staleSubscriptionIds)
  }

  return { sent, failed, evaluated: targets.length, cleaned: staleSubscriptionIds.length }
}
