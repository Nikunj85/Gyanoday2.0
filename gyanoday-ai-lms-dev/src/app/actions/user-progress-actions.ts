'use server'

import { userProgressServerService } from '@/services/user-progress-server-service'

export async function toggleChapterCompletion(
  userId: string,
  chapterId: string,
  isCompleted: boolean
) {
  try {
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
