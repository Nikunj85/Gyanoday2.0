'use server'

import { createClient } from '@/lib/supabase/server'
import { userSummaryAiService } from '@/services/ai/user-summary-ai-service'
import { userServerService } from '@/services/user-server-service'

import { getWeeklyStreak } from './streak-actions'

export interface LinkedStudentSummary {
  id: string
  name: string
  email: string
  class_name: string | null
  language: string
}

/**
 * Returns the students linked to the currently authenticated parent.
 * Relies entirely on the "Parents read own links" / "Parents read linked
 * student profile" RLS policies — no service-role client involved, so a
 * parent can only ever see their own linked children no matter what.
 */
export async function getLinkedStudents(): Promise<LinkedStudentSummary[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('parent_student_links')
    .select('student:users!student_id(id, name, email, language, class:classes(name))')
    .eq('parent_id', user.id)

  if (error) throw error

  return (data || [])
    .map((row: any) => row.student)
    .filter(Boolean)
    .map((s: any) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      language: s.language || 'en',
      class_name: s.class?.name || null,
    }))
}

/** Verifies the current parent session is actually linked to this student
 * before doing anything else — defense in depth on top of RLS. */
async function assertParentOfStudent(studentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('parent_student_links')
    .select('id')
    .eq('parent_id', user.id)
    .eq('student_id', studentId)
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('You are not linked to this student.')

  return { supabase, parentId: user.id }
}

export interface ChildProgressSummary {
  studentId: string
  studentName: string
  averageScorePct: number
  totalAttempts: number
  chaptersCompleted: number
  totalChapters: number
  weeklyStudyMinutes: number
  currentStreakDays: number
  weakAreas: string[]
}

/**
 * Aggregates the metrics a parent actually cares about — study
 * consistency and concept mastery — for one linked child. Every read here
 * goes through the parent's own session, scoped by the
 * `is_parent_of()` RLS policies already defined on quiz_attempts,
 * user_chapter_progress, and ai_insights.
 */
export async function getChildProgressSummary(studentId: string): Promise<ChildProgressSummary> {
  const { supabase } = await assertParentOfStudent(studentId)

  const studentData = await userServerService.getUserById(studentId)
  if (!studentData) throw new Error('Student not found.')

  const [attemptsRes, progressRes, chaptersCountRes, insights, streakResult] = await Promise.all([
    supabase
      .from('quiz_attempts')
      .select('score, started_at, submitted_at, created_at')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('user_chapter_progress')
      .select('is_completed', { count: 'exact' })
      .eq('user_id', studentId)
      .eq('is_completed', true),
    studentData.class_id
      ? supabase
          .from('chapters')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', studentData.class_id)
          .eq('is_visible', true)
      : Promise.resolve({ count: 0 }),
    userServerService.getStudentInsights(studentId),
    getWeeklyStreak(studentId),
  ])

  const attempts = attemptsRes.data || []
  const totalAttempts = attempts.length
  const averageScorePct =
    totalAttempts > 0
      ? Math.round(
          (attempts.reduce((sum, a: any) => sum + (Number(a.score) || 0), 0) / totalAttempts) * 100
        ) / 100
      : 0

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const weeklyStudyMinutes = attempts
    .filter((a: any) => a.started_at && a.submitted_at && new Date(a.created_at) >= sevenDaysAgo)
    .reduce((sum, a: any) => {
      const mins = (new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 60000
      return sum + (mins > 0 && mins < 120 ? mins : 0) // discard bad/negative or absurd outlier durations
    }, 0)

  const weakAreasSet = new Set<string>()
  ;(insights || []).forEach((insight: any) => {
    ;(insight.weak_areas || []).forEach((area: string) => weakAreasSet.add(area))
  })

  // Derive a Duolingo-style "current streak" count from the same weekly
  // data the student's own dashboard shows — count consecutive active
  // days walking backward from today.
  let currentStreakDays = 0
  if (streakResult.success && streakResult.data) {
    const activeStatuses = new Set(['missed', 'not_joined', 'future'])
    const todayIndex = streakResult.data.findIndex((d) => d.isToday)
    if (todayIndex !== -1) {
      for (let i = todayIndex; i >= 0; i--) {
        const day = streakResult.data[i]
        if (activeStatuses.has(day.status)) break
        currentStreakDays++
      }
    }
  }

  return {
    studentId,
    studentName: studentData.name || 'Student',
    averageScorePct,
    totalAttempts,
    chaptersCompleted: progressRes.count || 0,
    totalChapters: chaptersCountRes.count || 0,
    weeklyStudyMinutes: Math.round(weeklyStudyMinutes),
    currentStreakDays,
    weakAreas: Array.from(weakAreasSet).slice(0, 5),
  }
}

/**
 * Generates (fresh, on-demand — not cached) the professional, parent-tone
 * progress summary for one linked child.
 */
export async function generateChildParentSummary(studentId: string, language: string = 'en') {
  await assertParentOfStudent(studentId)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [progress, parentProfile] = await Promise.all([
    getChildProgressSummary(studentId),
    user ? userServerService.getUserById(user.id) : null,
  ])

  const performanceData = {
    average_score_percent: progress.averageScorePct,
    total_quiz_attempts: progress.totalAttempts,
    chapters_completed: progress.chaptersCompleted,
    total_chapters: progress.totalChapters,
    study_minutes_last_7_days: progress.weeklyStudyMinutes,
    current_streak_days: progress.currentStreakDays,
    weak_concepts: progress.weakAreas,
  }

  const { summary } = await userSummaryAiService.generateParentSummary(
    performanceData,
    language,
    progress.studentName,
    parentProfile?.name || undefined
  )

  return { ...progress, summary }
}
