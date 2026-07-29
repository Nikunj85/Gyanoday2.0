import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

export const dashboardService = {
  async getDashboardStats() {
    try {
      // Fetch all counts in parallel for efficiency
      const [
        { count: userCount, error: userError },
        { count: classCount, error: classError },
        { count: subjectCount, error: subjectError },
        { count: chapterCount, error: chapterError },
        { count: attemptCount, error: attemptError },
      ] = await Promise.all([
        supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('classes').select('*', { count: 'exact', head: true }),
        supabase.from('subjects').select('*', { count: 'exact', head: true }),
        supabase.from('chapters').select('*', { count: 'exact', head: true }),
        supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
      ])

      if (userError) throw userError
      if (classError) throw classError
      if (subjectError) throw subjectError
      if (chapterError) throw chapterError
      if (attemptError) throw attemptError

      return {
        userCount: userCount || 0,
        classCount: classCount || 0,
        subjectCount: subjectCount || 0,
        chapterCount: chapterCount || 0,
        attemptCount: attemptCount || 0,
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      throw error
    }
  },

  async getUserGrowthStats(interval: 'week' | 'month') {
    try {
      // 1. Fetch student registration dates
      const { data: users, error } = await supabase
        .from('users')
        .select('created_at')
        .eq('role', 'student')
        .order('created_at', { ascending: true })

      if (error) throw error

      const now = new Date()
      let chartData: { name: string; count: number }[] = []
      let growthPercentage = 0

      if (interval === 'week') {
        // Last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(now.getDate() - (6 - i))
          return {
            date: date.toISOString().split('T')[0],
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          }
        })

        const currentPeriodCounts = last7Days.map((day) => {
          const count = users.filter((u: { created_at: string }) =>
            u.created_at.startsWith(day.date)
          ).length
          return { name: day.label, count }
        })

        chartData = currentPeriodCounts

        // Growth: This week vs Previous week
        const thisWeekStart = new Date()
        thisWeekStart.setDate(now.getDate() - 7)
        const prevWeekStart = new Date()
        prevWeekStart.setDate(now.getDate() - 14)

        const thisWeekCount = users.filter(
          (u: { created_at: string }) => new Date(u.created_at) >= thisWeekStart
        ).length
        const prevWeekCount = users.filter(
          (u: { created_at: string }) =>
            new Date(u.created_at) >= prevWeekStart && new Date(u.created_at) < thisWeekStart
        ).length

        growthPercentage =
          prevWeekCount === 0
            ? thisWeekCount * 100
            : ((thisWeekCount - prevWeekCount) / prevWeekCount) * 100
      } else {
        // Last 6 months
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = new Date()
          date.setMonth(now.getMonth() - (5 - i))
          return {
            year: date.getFullYear(),
            month: date.getMonth(),
            label: date.toLocaleDateString('en-US', { month: 'short' }),
          }
        })

        const currentPeriodCounts = last6Months.map((m) => {
          const count = users.filter((u: { created_at: string }) => {
            const d = new Date(u.created_at)
            return d.getFullYear() === m.year && d.getMonth() === m.month
          }).length
          return { name: m.label, count }
        })

        chartData = currentPeriodCounts

        // Growth: Current month vs Previous month
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)

        const thisMonthCount = users.filter(
          (u: { created_at: string }) => new Date(u.created_at) >= thisMonthStart
        ).length
        const prevMonthCount = users.filter(
          (u: { created_at: string }) =>
            new Date(u.created_at) >= prevMonthStart && new Date(u.created_at) < thisMonthStart
        ).length

        growthPercentage =
          prevMonthCount === 0
            ? thisMonthCount * 100
            : ((thisMonthCount - prevMonthCount) / prevMonthCount) * 100
      }

      return {
        chartData,
        growthPercentage: Math.round(growthPercentage),
      }
    } catch (error) {
      console.error('Error fetching user growth stats:', error)
      throw error
    }
  },

  async getEngagementStats(interval: 'week' | 'month') {
    try {
      // 1. Fetch data from Supabase
      const [{ data: attempts, error: attemptsError }, { data: progress, error: progressError }] =
        await Promise.all([
          supabase
            .from('quiz_attempts')
            .select('created_at')
            .order('created_at', { ascending: true }),
          supabase
            .from('user_chapter_progress')
            .select('completed_at')
            .eq('is_completed', true)
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: true }),
        ])

      if (attemptsError) throw attemptsError
      if (progressError) throw progressError

      const now = new Date()
      let chartData: { name: string; attempts: number; completions: number }[] = []

      if (interval === 'week') {
        // Last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date()
          date.setDate(now.getDate() - (6 - i))
          return {
            date: date.toISOString().split('T')[0],
            label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          }
        })

        chartData = last7Days.map((day) => {
          const attemptCount = (attempts || []).filter((a: { created_at: string }) =>
            a.created_at.startsWith(day.date)
          ).length
          const completionCount = (progress || []).filter((p: { completed_at: string | null }) =>
            p.completed_at?.startsWith(day.date)
          ).length
          return { name: day.label, attempts: attemptCount, completions: completionCount }
        })
      } else {
        // Last 6 months
        const last6Months = Array.from({ length: 6 }, (_, i) => {
          const date = new Date()
          date.setMonth(now.getMonth() - (5 - i))
          return {
            year: date.getFullYear(),
            month: date.getMonth(),
            label: date.toLocaleDateString('en-US', { month: 'short' }),
          }
        })

        chartData = last6Months.map((m) => {
          const attemptCount = (attempts || []).filter((a: { created_at: string }) => {
            const d = new Date(a.created_at)
            return d.getFullYear() === m.year && d.getMonth() === m.month
          }).length
          const completionCount = (progress || []).filter((p: { completed_at: string | null }) => {
            if (!p.completed_at) return false
            const d = new Date(p.completed_at)
            return d.getFullYear() === m.year && d.getMonth() === m.month
          }).length
          return { name: m.label, attempts: attemptCount, completions: completionCount }
        })
      }

      return chartData
    } catch (error) {
      console.error('Error fetching engagement stats:', error)
      throw error
    }
  },
}
