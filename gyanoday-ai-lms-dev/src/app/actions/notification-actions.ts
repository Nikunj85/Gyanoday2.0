'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

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
