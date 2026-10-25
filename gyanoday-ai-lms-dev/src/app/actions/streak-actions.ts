'use server'

import { requireSelf } from '@/lib/auth/guards'
import { quizServerService } from '@/services/quiz-server-service'
import { settingsService } from '@/services/settings-server-service'
import { userProgressServerService } from '@/services/user-progress-server-service'
import { StreakDayData, StreakRule } from '@/types'

export async function getWeeklyStreak(userId: string) {
  try {
    if (!userId) {
      throw new Error('User ID is required to get weekly streak.')
    }
    await requireSelf(userId)

    // 1. Fetch Streak Config
    let config: { rules: StreakRule[] }
    try {
      const setting = await settingsService.getSettingBasedOnKey('STREAK_EMOJI_CONFIG')
      config = typeof setting.value === 'string' ? JSON.parse(setting.value) : setting.value
    } catch (error) {
      console.error('Error fetching STREAK_EMOJI_CONFIG:', error)
      throw new Error('Failed to fetch streak configuration.')
    }

    const rules = config.rules.sort((a, b) => a.priority - b.priority)

    // Helper to get YYYY-MM-DD in local time
    const getLocalYYYYMMDD = (d: Date) => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    // 2. Calculate Week Range (Day Wise - purely by date string boundaries)
    const now = new Date()
    const currentDay = now.getDay() // 0-6 (Sun-Sat)
    const dayOffset = currentDay === 0 ? 6 : currentDay - 1 // 0 for Mon, 1 for Tue, ..., 6 for Sun

    const monday = new Date(now)
    monday.setDate(now.getDate() - dayOffset)

    // To include the whole week day-wise, we query from Monday to the start of Next Monday
    const nextMonday = new Date(monday)
    nextMonday.setDate(monday.getDate() + 7)

    const mondayString = getLocalYYYYMMDD(monday)
    const nextMondayString = getLocalYYYYMMDD(nextMonday)
    const todayString = getLocalYYYYMMDD(now)

    // 3. Fetch Activity via Services
    const [quizAttempts, chapterCompletions] = await Promise.all([
      quizServerService.getWeeklyQuizAttempts(userId, mondayString, nextMondayString),
      userProgressServerService.getWeeklyChapterCompletions(userId, mondayString, nextMondayString),
    ])

    // 4. Process Days
    const days: StreakDayData[] = []
    const dayNames = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

    for (let i = 0; i < 7; i++) {
      const currentLoopDate = new Date(monday)
      currentLoopDate.setDate(monday.getDate() + i)

      const dateString = getLocalYYYYMMDD(currentLoopDate)

      // Purely day-wise comparisons (YYYY-MM-DD strings natively sort chronologically)
      const isToday = dateString === todayString
      const isFuture = dateString > todayString

      // Count activities for this specific date
      const dayQuizzes = quizAttempts.filter((a) => {
        const aDate = new Date(a.created_at)
        return getLocalYYYYMMDD(aDate) === dateString
      }).length

      const dayChapters = chapterCompletions.filter((c) => {
        if (!c.completed_at) return false
        const cDate = new Date(c.completed_at)
        return getLocalYYYYMMDD(cDate) === dateString
      }).length

      // Evaluate rules
      let matchedRule = rules.find((rule) => {
        const { conditions } = rule

        // Check isToday condition
        if (conditions.isToday !== undefined && conditions.isToday !== isToday) return false

        // Exact matches
        if (conditions.quizzes !== undefined && dayQuizzes !== conditions.quizzes) return false
        if (conditions.chapters !== undefined && dayChapters !== conditions.chapters) return false

        // Min matches
        if (conditions.min_quizzes !== undefined && dayQuizzes < conditions.min_quizzes)
          return false
        if (conditions.min_chapters !== undefined && dayChapters < conditions.min_chapters)
          return false

        // Any activity
        if (conditions.any_activity && dayQuizzes === 0 && dayChapters === 0) return false

        return true
      })

      // Default to "missed" if no rule matched and not future
      if (!matchedRule && !isFuture) {
        matchedRule = rules.find((r) => r.key === 'missed')
      }

      // Days before registration are treated like any other past day with no activity:
      // they fall through to the "missed" rule below, so they render and flip like missed cards.

      days.push({
        day: dayNames[i],
        date: currentLoopDate.getDate(),
        fullDate: dateString,
        quizzes: dayQuizzes,
        chapters: dayChapters,
        isToday,
        isFuture,
        status: isFuture ? 'future' : matchedRule?.key || 'missed',
        gif: isFuture ? '' : matchedRule?.gif || '',
        color: isFuture ? '#a1a1aa' : matchedRule?.color || '#EF4444',
        label: isFuture
          ? 'Future'
          : matchedRule?.label || (matchedRule?.key === 'missed' ? 'Missed' : ''),
      })
    }

    return {
      success: true,
      data: days,
      rules: config.rules, // Include rules for the info dialog
    }
  } catch (error) {
    console.error('[getWeeklyStreak] ERROR:', error)
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred while fetching the streak data',
    }
  }
}
