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
}

export interface SubjectProgressOverview {
  id: string
  name: string
  colorCode: string | null
  chapters: ChapterMasteryNode[]
  completedCount: number
  totalCount: number
  progressPct: number
  strengths: string[]
  weaknesses: string[]
  revisionTopics: string[]
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

export interface StudentProgressOverview {
  subjects: SubjectProgressOverview[]
  weakConcepts: WeakConcept[]
  studyTimeByDay: StudyDay[]
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
    return { subjects: [], weakConcepts: [], studyTimeByDay: [] }
  }

  const [{ data: subjects }, { data: chapters }, { data: progress }, { data: insights }, { data: attempts }] =
    await Promise.all([
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
        .select('chapter_id, is_completed')
        .eq('user_id', userId)
        .eq('is_completed', true),
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
    ])

  const completedChapterIds = new Set((progress || []).map((p: any) => p.chapter_id))

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
        if (insight?.score_context?.quiz_score != null && insight?.score_context?.total_questions) {
          lastScorePct = Math.round(
            (insight.score_context.quiz_score / insight.score_context.total_questions) * 100
          )
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
        }
      })

      const completedCount = chapterNodes.filter((c) => c.isCompleted).length
      const totalCount = chapterNodes.length

      // Build subject-level learning signals from the latest insight for each
      // chapter. Strengths are chapters with strong mastery (85%+), while
      // weaknesses are chapters that still need practice/revision. The AI
      // weak areas become the concrete topics the student should revise.
      const strengths = chapterNodes
        .filter((c) => c.masteryLevel === 'strong')
        .sort((a, b) => (b.lastScorePct ?? 0) - (a.lastScorePct ?? 0))
        .slice(0, 3)
        .map((c) => c.title)

      const weaknesses = chapterNodes
        .filter((c) => c.masteryLevel === 'needs_revision' || c.masteryLevel === 'needs_practice')
        .sort((a, b) => (a.lastScorePct ?? 0) - (b.lastScorePct ?? 0))
        .slice(0, 3)
        .map((c) => c.title)

      const revisionTopicTally = new Map<string, { count: number; display: string }>()
      subjectChapters.forEach((ch: any) => {
        const insight = latestInsightByChapter.get(ch.id)
        const weakAreas: string[] = Array.isArray(insight?.weak_areas) ? insight.weak_areas : []
        weakAreas.forEach((raw) => {
          const topic = String(raw || '').trim()
          if (!topic) return
          const key = topic.toLowerCase()
          const existing = revisionTopicTally.get(key)
          if (existing) existing.count++
          else revisionTopicTally.set(key, { count: 1, display: topic })
        })
      })

      const revisionTopics = Array.from(revisionTopicTally.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 4)
        .map((v) => v.display)

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
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const minutesByDate = new Map<string, number>()
  ;(attempts || []).forEach((a: any) => {
    if (!a.started_at || !a.submitted_at) return
    const mins = (new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 60000
    if (mins <= 0 || mins >= 120) return
    const dateKey = new Date(a.created_at).toISOString().slice(0, 10)
    minutesByDate.set(dateKey, (minutesByDate.get(dateKey) || 0) + mins)
  })
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateKey = d.toISOString().slice(0, 10)
    studyTimeByDay.push({
      day: dayLabels[d.getDay()],
      date: dateKey,
      minutes: Math.round(minutesByDate.get(dateKey) || 0),
    })
  }

  return { subjects: subjectOverviews, weakConcepts, studyTimeByDay }
}
