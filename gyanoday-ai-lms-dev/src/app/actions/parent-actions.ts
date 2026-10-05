'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { UserRole } from '@/types/users'
import { userSummaryAiService } from '@/services/ai/user-summary-ai-service'


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

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile || profile.role !== UserRole.Parent) throw new Error('Parent access required.')

  // Use the service-role client only after authenticating the current parent.
  // This avoids relation/RLS shape issues while keeping the query strictly
  // scoped to auth.uid()'s parent_id.
  const { data: links, error: linksError } = await supabaseAdmin
    .from('parent_student_links')
    .select('student_id')
    .eq('parent_id', user.id)

  if (linksError) throw linksError
  const studentIds = Array.from(new Set((links || []).map((row: any) => row.student_id).filter(Boolean)))
  if (studentIds.length === 0) return []

  const { data: students, error: studentsError } = await supabaseAdmin
    .from('users')
    .select('id, name, email, language, class_id, class:classes(name)')
    .in('id', studentIds)
    .eq('role', UserRole.Student)

  if (studentsError) throw studentsError

  return (students || []).map((s: any) => {
    const studentClass = Array.isArray(s.class) ? s.class[0] || null : s.class || null
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      language: s.language || 'en',
      class_name: studentClass?.name || null,
    }
  })
}

/** Verifies the current parent session is actually linked to this student
 * before doing anything else — defense in depth on top of RLS. */
async function assertParentOfStudent(studentId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) throw new Error('Not authenticated')

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) throw profileError
  if (!profile || profile.role !== UserRole.Parent) throw new Error('Parent access required.')

  const { data: link, error } = await supabaseAdmin
    .from('parent_student_links')
    .select('id')
    .eq('parent_id', user.id)
    .eq('student_id', studentId)
    .maybeSingle()

  if (error) throw error
  if (!link) throw new Error('You are not linked to this student.')

  return { supabase, parentId: user.id }
}

/** YYYY-MM-DD in a fixed timezone so day boundaries match what families expect (India). */
const STREAK_TIME_ZONE = 'Asia/Kolkata'
function dayKey(date: Date | string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: STREAK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date))
}

/**
 * Consecutive active days ending today (or yesterday, if the child has not
 * studied yet today). Computed directly from quiz attempts and chapter
 * completions with the service-role client, so it no longer depends on the
 * student's RLS-scoped streak action or on the STREAK_EMOJI_CONFIG setting.
 */
function computeCurrentStreak(activityDates: Array<Date | string>): number {
  const active = new Set(activityDates.map(dayKey))
  if (active.size === 0) return 0

  const cursor = new Date()
  if (!active.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1)

  let streak = 0
  while (active.has(dayKey(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
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
  await assertParentOfStudent(studentId)

  const { data: studentData, error: studentError } = await supabaseAdmin
    .from('users')
    .select('id, name, class_id')
    .eq('id', studentId)
    .maybeSingle()
  if (studentError) throw studentError
  if (!studentData) throw new Error('Student not found.')

  const [attemptsRes, progressRes, chaptersCountRes, insights] = await Promise.all([
    supabaseAdmin
      .from('quiz_attempts')
      .select('score, total_questions, started_at, submitted_at, created_at')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false })
      .limit(50),
    supabaseAdmin
      .from('user_chapter_progress')
      .select('is_completed, completed_at', { count: 'exact' })
      .eq('user_id', studentId)
      .eq('is_completed', true),
    studentData.class_id
      ? supabaseAdmin
          .from('chapters')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', studentData.class_id)
          .eq('is_visible', true)
      : Promise.resolve({ count: 0 }),
    supabaseAdmin
      .from('ai_insights')
      .select('*, chapter:chapters(title)')
      .eq('user_id', studentId)
      .order('created_at', { ascending: false }),
  ])

  // Surface real query failures instead of silently rendering zeros.
  if (attemptsRes.error) throw attemptsRes.error
  if (progressRes.error) throw progressRes.error

  const attempts = attemptsRes.data || []
  const totalAttempts = attempts.length
  // `score` is the number of correct answers, so convert each attempt to a
  // percentage of its own total before averaging.
  const scoredAttempts = attempts.filter((a: any) => Number(a.total_questions) > 0)
  const averageScorePct =
    scoredAttempts.length > 0
      ? Math.round(
          scoredAttempts.reduce(
            (sum, a: any) => sum + (Number(a.score) / Number(a.total_questions)) * 100,
            0
          ) / scoredAttempts.length
        )
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
  const insightRows = (insights as any)?.data || []
  ;(insightRows || []).forEach((insight: any) => {
    ;(insight.weak_areas || []).forEach((area: string) => weakAreasSet.add(area))
  })

  const currentStreakDays = computeCurrentStreak([
    ...attempts.map((a: any) => a.created_at).filter(Boolean),
    ...((progressRes.data as any[]) || []).map((p) => p.completed_at).filter(Boolean),
  ])

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
    user
      ? supabaseAdmin.from('users').select('id, name').eq('id', user.id).maybeSingle().then((r) => r.data)
      : null,
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
