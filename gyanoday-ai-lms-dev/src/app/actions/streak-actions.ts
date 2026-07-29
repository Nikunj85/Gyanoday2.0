'use server'

import { quizServerService } from '@/services/quiz-server-service'
import { settingsService } from '@/services/settings-server-service'
import { userProgressServerService } from '@/services/user-progress-server-service'
import { userServerService } from '@/services/user-server-service'
import { StreakDayData, StreakRule } from '@/types'

export async function getWeeklyStreak(userId: string) {
  try {
    if (!userId) {
      throw new Error('User ID is required to get weekly streak.')
    }

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
    const [quizAttempts, chapterCompletions, userData] = await Promise.all([
      quizServerService.getWeeklyQuizAttempts(userId, mondayString, nextMondayString),
      userProgressServerService.getWeeklyChapterCompletions(userId, mondayString, nextMondayString),
      userServerService.getUserById(userId),
    ])

    // Get user registration date (YYYY-MM-DD) for "not joined yet" logic
    const userRegistrationDate = userData?.created_at
      ? getLocalYYYYMMDD(new Date(userData.created_at))
      : null

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
      const isBeforeRegistration = userRegistrationDate ? dateString < userRegistrationDate : false

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

      // If the day is before the user registered, show "Not Joined Yet" instead of "Missed"
      if (isBeforeRegistration) {
        days.push({
          day: dayNames[i],
          date: currentLoopDate.getDate(),
          fullDate: dateString,
          quizzes: 0,
          chapters: 0,
          isToday: false,
          isFuture: true, // Treat visually like a future day (greyed out, no flip)
          status: 'not_joined',
          gif: '',
          color: '#a1a1aa',
          label: { en: 'Not Joined Yet', hi: 'अभी जुड़े नहीं थे', gu: 'હજુ જોડાયા ન હતા' },
        })
        continue
      }

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
