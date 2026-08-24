import { NextRequest, NextResponse } from 'next/server'

import { sendStreakReminders } from '@/app/actions/notification-actions'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * Triggered once a day (evening) by Vercel Cron — see `vercel.json`.
 * Protected by CRON_SECRET so it can't be hit by anyone else; Vercel Cron
 * automatically sends this as a Bearer token on scheduled invocations.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')

  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_SECRET is not configured on the server.' },
      { status: 500 }
    )
  }

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await sendStreakReminders()
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send streak reminders.'
    console.error('[cron/streak-reminders] ERROR:', message)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
