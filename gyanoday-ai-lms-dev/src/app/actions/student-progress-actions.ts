'use server'

import { createClient } from '@/lib/supabase/server'

export type MasteryLevel = 'strong' | 'needs_practice' | 'needs_revision' | 'not_attempted'

export interface ChapterMasteryNode {
  id: string
  title: string
  orderNum: number
  isCompleted: boolean
  /** Presentational sequencing for the Learning Journey Map — the first
   * not-yet-completed chapter in order is "current", everything after it
   * is shown as locked/greyed. This is separate from the admin-controlled
   * `is_locked` content-visibility flag on the chapter itself. */
  mapState: 'completed' | 'current' | 'locked'
  masteryLevel: MasteryLevel
  lastScorePct: number | null
  /** How many quiz attempts/insights exist for this chapter — used both
   * for the Strength/Weakness detail popover and to distinguish "never
   * attempted" from "attempted and scored low". */
  attempts: number
  /** Student-flagged "revise this chapter" toggle — independent of AI-driven
   * mastery signals, this is a plain manual flag the student sets themselves. */
  needsRevision: boolean
  /** Whether a personal note already exists for this chapter (so the UI can
   * show a filled vs. empty note icon without a separate round-trip). */
  hasNote: boolean
}

export interface SubjectProgressOverview {
  id: string
  name: string
  colorCode: string | null
  chapters: ChapterMasteryNode[]
  completedCount: number
  totalCount: number
  progressPct: number
  strengths: ChapterSignal[]
  weaknesses: ChapterSignal[]
  revisionTopics: RevisionSignal[]
}

/** A strength/weakness entry backed by real quiz performance for one
 * chapter — not just a bare title — so the dashboard can show the actual
 * numbers ("92% · 3 attempts") when a student clicks into it, instead of
 * a name with nothing behind it. */
export interface ChapterSignal {
  chapterId: string
  title: string
  scorePct: number
  attempts: number
}

export interface RevisionSignal {
  topic: string
  timesFlagged: number
  chapterId?: string
  chapterTitle?: string
}

export interface WeakConcept {
  topic: string
  timesFlagged: number
  chapterId?: string
  chapterTitle?: string
}

export interface StudyDay {
  day: string // 'Mon', 'Tue', ...
  date: string // ISO date
  minutes: number
}

export interface StudyWeek {
  label: string
  weekStart: string
  minutes: number
}

export interface StudentProgressOverview {
  subjects: SubjectProgressOverview[]
  weakConcepts: WeakConcept[]
  studyTimeByDay: StudyDay[]
  studyTimeByWeek: StudyWeek[]
}

function masteryFromScore(pct: number): MasteryLevel {
  if (pct < 60) return 'needs_revision'
  if (pct < 85) return 'needs_practice'
  return 'strong'
}

export async function getStudentProgressOverview(
  userId: string,
  classId: string | null
): Promise<StudentProgressOverview> {
  const supabase = await createClient()

  if (!classId) {
    return { subjects: [], weakConcepts: [], studyTimeByDay: [], studyTimeByWeek: [] }
  }

  const [
    { data: subjects },
    { data: chapters },
    { data: progress },
    { data: insights },
    { data: attempts },
    { data: notes },
    { data: quizzesMeta },
  ] = await Promise.all([
      supabase
        .from('subjects')
        .select('id, name, color_code, order_num')
        .eq('is_active', true)
        .order('order_num', { ascending: true }),
      supabase
        .from('chapters')
        .select('id, subject_id, title, order_num')
        .eq('class_id', classId)
        .eq('is_visible', true)
        .order('order_num', { ascending: true }),
      supabase
        .from('user_chapter_progress')
        .select('chapter_id, is_completed, needs_revision')
        .eq('user_id', userId),
      supabase
        .from('ai_insights')
        .select('chapter_id, weak_areas, score_context, created_at, chapter:chapters(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      supabase
        .from('quiz_attempts')
        .select('started_at, submitted_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(200),
      supabase
        .from('student_notes')
        .select('chapter_id')
        .eq('user_id', userId)
        .not('chapter_id', 'is', null),
      // Fallback denominator for historical ai_insights rows saved before
      // total_questions was included in score_context — without this,
      // every quiz result recorded before that fix would silently show up
      // as "no data" on the dashboard forever.
      supabase.from('quizzes').select('chapter_id, num_questions, topic'),
    ])

  const completedChapterIds = new Set(
    (progress || []).filter((p: any) => p.is_completed).map((p: any) => p.chapter_id)
  )
  const revisionFlaggedChapterIds = new Set(
    (progress || []).filter((p: any) => p.needs_revision).map((p: any) => p.chapter_id)
  )
  const chapterIdsWithNotes = new Set((notes || []).map((n: any) => n.chapter_id))

  // Fallback denominator map, chapter_id -> num_questions, for insight
  // rows saved before total_questions existed in score_context.
  const numQuestionsByChapter = new Map<string, number>()
  ;(quizzesMeta || []).forEach((q: any) => {
    if (!q.chapter_id || !q.num_questions) return
    // Prefer the main whole-chapter quiz (topic === null) as the
    // denominator source over a topic-scoped practice quiz, which may
    // have a different question count.
    const isMainQuiz = !q.topic
    if (isMainQuiz || !numQuestionsByChapter.has(q.chapter_id)) {
      numQuestionsByChapter.set(q.chapter_id, q.num_questions)
    }
  })

  // How many insights (≈ quiz attempts) exist per chapter — this is what
  // lets the Strength/Weakness cards show a real "N attempts" number
  // instead of just a bare chapter name.
  const insightCountByChapter = new Map<string, number>()
  ;(insights || []).forEach((row: any) => {
    if (!row.chapter_id) return
    insightCountByChapter.set(row.chapter_id, (insightCountByChapter.get(row.chapter_id) || 0) + 1)
  })

  // Latest insight per chapter (insights are already ordered newest-first).
  const latestInsightByChapter = new Map<string, any>()
  ;(insights || []).forEach((row: any) => {
    if (!row.chapter_id) return
    if (!latestInsightByChapter.has(row.chapter_id)) {
      latestInsightByChapter.set(row.chapter_id, row)
    }
  })

  // Weak concepts, ranked by how often they've been flagged across every
  // past attempt (not just the latest), same "persistent gap over one-off
  // mistake" reasoning as the per-chapter targeted-practice recommender.
  const tally = new Map<string, { count: number; display: string; chapterId?: string; chapterTitle?: string }>()
  ;(insights || []).forEach((row: any) => {
    const weakAreas: string[] = Array.isArray(row.weak_areas) ? row.weak_areas : []
    weakAreas.forEach((raw) => {
      const topic = (raw || '').trim()
      if (!topic) return
      const key = topic.toLowerCase()
      const existing = tally.get(key)
      if (existing) {
        existing.count++
      } else {
        tally.set(key, {
          count: 1,
          display: topic,
          chapterId: row.chapter_id,
          chapterTitle: row.chapter?.title,
        })
      }
    })
  })
  const weakConcepts: WeakConcept[] = Array.from(tally.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map((v) => ({
      topic: v.display,
      timesFlagged: v.count,
      chapterId: v.chapterId,
      chapterTitle: v.chapterTitle,
    }))

  // Group chapters by subject, in order, building each chapter's mastery
  // node for the Learning Journey Map + Weak Concept Indicator cards.
  const chaptersBySubject = new Map<string, any[]>()
  ;(chapters || []).forEach((ch: any) => {
    const list = chaptersBySubject.get(ch.subject_id) || []
    list.push(ch)
    chaptersBySubject.set(ch.subject_id, list)
  })

  const subjectOverviews: SubjectProgressOverview[] = (subjects || [])
    .map((subject: any) => {
      const subjectChapters = chaptersBySubject.get(subject.id) || []
      if (subjectChapters.length === 0) return null

      let currentAssigned = false
      const chapterNodes: ChapterMasteryNode[] = subjectChapters.map((ch: any) => {
        const isCompleted = completedChapterIds.has(ch.id)
        const insight = latestInsightByChapter.get(ch.id)

        let lastScorePct: number | null = null
        let masteryLevel: MasteryLevel = 'not_attempted'
        const rawScore = insight?.score_context?.quiz_score
        // Prefer total_questions saved on the insight itself; fall back to
        // the chapter's quiz config for older insight rows saved before
        // that field existed (see insight-actions.ts fix).
        const denominator =
          insight?.score_context?.total_questions || numQuestionsByChapter.get(ch.id)
        if (rawScore != null && denominator) {
          lastScorePct = Math.round((rawScore / denominator) * 100)
          masteryLevel = masteryFromScore(lastScorePct)
        }

        let mapState: ChapterMasteryNode['mapState']
        if (isCompleted) {
          mapState = 'completed'
        } else if (!currentAssigned) {
          mapState = 'current'
          currentAssigned = true
        } else {
          mapState = 'locked'
        }

        return {
          id: ch.id,
          title: ch.title,
          orderNum: ch.order_num || 0,
          isCompleted,
          mapState,
          masteryLevel,
          lastScorePct,
          attempts: insightCountByChapter.get(ch.id) || 0,
          needsRevision: revisionFlaggedChapterIds.has(ch.id),
          hasNote: chapterIdsWithNotes.has(ch.id),
        }
      })

      const completedCount = chapterNodes.filter((c) => c.isCompleted).length
      const totalCount = chapterNodes.length

      // Build subject-level learning signals straight from each chapter's
      // real quiz performance — strengths are chapters that were actually
      // attempted and scored well (85%+), weaknesses are chapters that
      // were actually attempted and came back low. Chapters marked
      // "complete" without ever taking a quiz correctly show up as
      // neither — there's no performance data to base a signal on.
      const strengths: ChapterSignal[] = chapterNodes
        .filter((c) => c.masteryLevel === 'strong' && c.lastScorePct != null)
        .sort((a, b) => (b.lastScorePct ?? 0) - (a.lastScorePct ?? 0))
        .slice(0, 3)
        .map((c) => ({
          chapterId: c.id,
          title: c.title,
          scorePct: c.lastScorePct as number,
          attempts: c.attempts,
        }))

      const weaknesses: ChapterSignal[] = chapterNodes
        .filter(
          (c) =>
            (c.masteryLevel === 'needs_revision' || c.masteryLevel === 'needs_practice') &&
            c.lastScorePct != null
        )
        .sort((a, b) => (a.lastScorePct ?? 0) - (b.lastScorePct ?? 0))
        .slice(0, 3)
        .map((c) => ({
          chapterId: c.id,
          title: c.title,
          scorePct: c.lastScorePct as number,
          attempts: c.attempts,
        }))

      const revisionTopicTally = new Map<
        string,
        { count: number; display: string; chapterId?: string; chapterTitle?: string }
      >()
      subjectChapters.forEach((ch: any) => {
        const insight = latestInsightByChapter.get(ch.id)
        const weakAreas: string[] = Array.isArray(insight?.weak_areas) ? insight.weak_areas : []
        weakAreas.forEach((raw) => {
          const topic = String(raw || '').trim()
          if (!topic) return
          const key = topic.toLowerCase()
          const existing = revisionTopicTally.get(key)
          if (existing) existing.count++
          else revisionTopicTally.set(key, { count: 1, display: topic, chapterId: ch.id, chapterTitle: ch.title })
        })
      })

      const revisionTopics: RevisionSignal[] = Array.from(revisionTopicTally.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
        .map((v) => ({
          topic: v.display,
          timesFlagged: v.count,
          chapterId: v.chapterId,
          chapterTitle: v.chapterTitle,
        }))

      return {
        id: subject.id,
        name: subject.name,
        colorCode: subject.color_code,
        chapters: chapterNodes,
        completedCount,
        totalCount,
        progressPct: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
        strengths,
        weaknesses,
        revisionTopics,
      }
    })
    .filter((s): s is SubjectProgressOverview => s !== null)

  // Study time for the last 7 days, in minutes, from quiz attempt duration
  // (started_at -> submitted_at) — same reasonable-outlier guard used for
  // the parent portal's weekly study-time metric.
  const studyTimeByDay: StudyDay[] = []
  const studyTimeByWeek: StudyWeek[] = []
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const minutesByDate = new Map<string, number>()
  ;(attempts || []).forEach((a: any) => {
    if (!a.started_at || !a.submitted_at) return
    const mins = (new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 60000
    if (mins <= 0 || mins >= 120) return
    const dateKey = new Date(a.created_at).toISOString().slice(0, 10)
    minutesByDate.set(dateKey, (minutesByDate.get(dateKey) || 0) + mins)
  })

  // Daily tracking: Monday through Sunday for the current week.
  const now = new Date()
  const currentDay = now.getDay()
  const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() + mondayOffset)

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateKey = d.toISOString().slice(0, 10)
    studyTimeByDay.push({
      day: dayLabels[d.getDay()],
      date: dateKey,
      minutes: Math.round(minutesByDate.get(dateKey) || 0),
    })
  }

  // Monthly tracking: aggregate the current calendar month into week buckets.
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const weekBuckets = new Map<string, number>()
  ;(attempts || []).forEach((a: any) => {
    if (!a.started_at || !a.submitted_at) return
    const mins = (new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 60000
    if (mins <= 0 || mins >= 120) return
    const date = new Date(a.created_at)
    if (date < monthStart || date > monthEnd) return
    const week = Math.floor((date.getDate() - 1) / 7) + 1
    const key = `Week ${week}`
    weekBuckets.set(key, (weekBuckets.get(key) || 0) + mins)
  })

  const totalWeeks = Math.ceil(monthEnd.getDate() / 7)
  for (let week = 1; week <= totalWeeks; week++) {
    const startDay = (week - 1) * 7 + 1
    const endDay = Math.min(week * 7, monthEnd.getDate())
    const weekStart = new Date(now.getFullYear(), now.getMonth(), startDay).toISOString().slice(0, 10)
    studyTimeByWeek.push({
      label: `Week ${week}`,
      weekStart,
      minutes: Math.round(weekBuckets.get(`Week ${week}`) || 0),
    })
  }

  return { subjects: subjectOverviews, weakConcepts, studyTimeByDay, studyTimeByWeek }
}
