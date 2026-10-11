'use server'

import { requireSelf } from '@/lib/auth/guards'
import { userProgressServerService } from '@/services/user-progress-server-service'

export async function toggleChapterCompletion(
  userId: string,
  chapterId: string,
  isCompleted: boolean
) {
  try {
    await requireSelf(userId)
    await userProgressServerService.toggleCompletion(userId, chapterId, isCompleted)

    // Optional: revalidate path if needed
    // revalidatePath(`/subjects/`)

    return { success: true }
  } catch (error: any) {
    console.error('Error in toggleChapterCompletion action:', error)
    return {
      success: false,
      error: error.message || 'Failed to update chapter progress',
    }
  }
}

/**
 * Marks several chapters (e.g. every chapter of a subject) completed / not completed
 * in one go. Each chapter goes through the same toggleCompletion path as a single tick,
 * so timestamps, streaks and progress stay consistent.
 */
export async function setChaptersCompletion(
  userId: string,
  chapterIds: string[],
  isCompleted: boolean
) {
  const ids = Array.from(new Set((chapterIds || []).filter(Boolean)))
  if (!userId || ids.length === 0) return { success: true, updated: 0, failed: 0 }
  try {
    await requireSelf(userId)
  } catch (error: any) {
    return { success: false, updated: 0, failed: ids.length, error: error.message || 'Forbidden' }
  }

  const results = await Promise.allSettled(
    ids.map((chapterId) => userProgressServerService.toggleCompletion(userId, chapterId, isCompleted))
  )

  const failed = results.filter((r) => r.status === 'rejected').length
  if (failed === ids.length) {
    return { success: false, updated: 0, failed, error: 'Failed to update chapter progress' }
  }
  return { success: failed === 0, updated: ids.length - failed, failed }
}
