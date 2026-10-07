'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  AlertCircle,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Lightbulb,
  Loader2,
  PenLine,
  RefreshCw,
  Rocket,
  Sparkles,
  Target,
  ThumbsUp,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import {
  ChildProgressSummary,
  generateChildParentSummary,
  getLinkedStudents,
  LinkedStudentSummary,
  ProgressStatus,
} from '@/app/actions/parent-actions'
import { languageLabel } from '@/lib/ai/language'
import type { ParentSummaryContent } from '@/services/ai/user-summary-ai-service'
import { useUserStore } from '@/store/user-store'

type ReportData = ChildProgressSummary & { summary: ParentSummaryContent; generatedAt: string }

/**
 * Makes the report safe to render whatever the server returned: an old plain-text
 * summary, missing lists, or a partly filled object must never crash the page.
 */
function normalizeReport(raw: any): ReportData {
  const rawSummary = raw?.summary
  const list = (v: unknown): string[] =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && !!x.trim()) : []

  let summary: ParentSummaryContent
  if (typeof rawSummary === 'string') {
    // Older server code returned one text block — show it as the headline rather than crashing.
    summary = { headline: rawSummary.trim(), highlights: [], focusAreas: [], homeTip: '' }
  } else {
    summary = {
      headline: typeof rawSummary?.headline === 'string' ? rawSummary.headline : '',
      highlights: list(rawSummary?.highlights),
      focusAreas: list(rawSummary?.focusAreas),
      homeTip: typeof rawSummary?.homeTip === 'string' ? rawSummary.homeTip : '',
    }
  }

  const validStatus: ProgressStatus[] = ['getting_started', 'excellent', 'on_track', 'needs_attention']

  return {
    ...raw,
    status: validStatus.includes(raw?.status) ? raw.status : 'on_track',
    weakAreas: list(raw?.weakAreas),
    averageScorePct: Number(raw?.averageScorePct) || 0,
    totalAttempts: Number(raw?.totalAttempts) || 0,
    chaptersCompleted: Number(raw?.chaptersCompleted) || 0,
    totalChapters: Number(raw?.totalChapters) || 0,
    weeklyStudyMinutes: Number(raw?.weeklyStudyMinutes) || 0,
    currentStreakDays: Number(raw?.currentStreakDays) || 0,
    generatedAt: raw?.generatedAt || new Date().toISOString(),
    summary,
  }
}

/* ---------- Labels (the report follows the child's medium) ---------- */

interface Labels {
  report: string
  loading: string
  tryAgain: string
  refresh: string
  updated: string
  noClass: string
  avgScore: string
  chaptersDone: string
  quizzes: string
  studyTime: string
  streak: string
  completion: string
  chaptersOf: (done: number, total: number) => string
  going: string
  attention: string
  tip: string
  concepts: string
  minutes: string
  days: string
  nothingYet: string
  status: Record<ProgressStatus, string>
}

const LABELS: Record<'English' | 'Hindi' | 'Gujarati', Labels> = {
  English: {
    report: 'Weekly Progress Report',
    loading: "Preparing this week's report…",
    tryAgain: 'Try again',
    refresh: 'Refresh',
    updated: 'Updated',
    noClass: 'No class assigned',
    avgScore: 'Avg. score',
    chaptersDone: 'Chapters done',
    quizzes: 'Quizzes practiced',
    studyTime: 'Study time (7d)',
    streak: 'Current streak',
    completion: 'Course completion',
    chaptersOf: (d, t) => `${d} of ${t} chapters`,
    going: "What's going well",
    attention: 'Needs attention',
    tip: 'How you can help at home',
    concepts: 'Concepts to reinforce',
    minutes: 'm',
    days: 'd',
    nothingYet: 'Nothing to highlight yet — activity will appear here once your child starts learning.',
    status: {
      excellent: 'Excellent',
      on_track: 'On track',
      needs_attention: 'Needs support',
      getting_started: 'Getting started',
    },
  },
  Hindi: {
    report: 'साप्ताहिक प्रगति रिपोर्ट',
    loading: 'इस सप्ताह की रिपोर्ट तैयार हो रही है…',
    tryAgain: 'फिर से कोशिश करें',
    refresh: 'रीफ़्रेश',
    updated: 'अपडेट',
    noClass: 'कोई कक्षा नहीं',
    avgScore: 'औसत स्कोर',
    chaptersDone: 'अध्याय पूरे',
    quizzes: 'क्विज़ अभ्यास',
    studyTime: 'अध्ययन समय (7 दिन)',
    streak: 'लगातार दिन',
    completion: 'कोर्स पूर्णता',
    chaptersOf: (d, t) => `${t} में से ${d} अध्याय`,
    going: 'जो अच्छा चल रहा है',
    attention: 'ध्यान देने योग्य',
    tip: 'घर पर आप कैसे मदद कर सकते हैं',
    concepts: 'इन अवधारणाओं को दोहराएँ',
    minutes: 'मि',
    days: 'दिन',
    nothingYet: 'अभी बताने के लिए कुछ नहीं — बच्चे के पढ़ना शुरू करते ही गतिविधि यहाँ दिखेगी।',
    status: {
      excellent: 'बहुत बढ़िया',
      on_track: 'सही राह पर',
      needs_attention: 'सहयोग की ज़रूरत',
      getting_started: 'शुरुआत',
    },
  },
  Gujarati: {
    report: 'સાપ્તાહિક પ્રગતિ અહેવાલ',
    loading: 'આ અઠવાડિયાનો અહેવાલ તૈયાર થઈ રહ્યો છે…',
    tryAgain: 'ફરી પ્રયાસ કરો',
    refresh: 'રીફ્રેશ',
    updated: 'અપડેટ',
    noClass: 'કોઈ વર્ગ નથી',
    avgScore: 'સરેરાશ સ્કોર',
    chaptersDone: 'પાઠ પૂર્ણ',
    quizzes: 'ક્વિઝ પ્રેક્ટિસ',
    studyTime: 'અભ્યાસ સમય (7 દિવસ)',
    streak: 'સતત દિવસો',
    completion: 'કોર્સ પૂર્ણતા',
    chaptersOf: (d, t) => `${t} માંથી ${d} પાઠ`,
    going: 'શું સારું ચાલી રહ્યું છે',
    attention: 'ધ્યાન આપવા જેવું',
    tip: 'ઘરે તમે કેવી રીતે મદદ કરી શકો',
    concepts: 'આ ખ્યાલો ફરી મજબૂત કરો',
    minutes: 'મિ',
    days: 'દિવસ',
    nothingYet: 'હજી દર્શાવવા જેવું કંઈ નથી — બાળક અભ્યાસ શરૂ કરશે એટલે પ્રવૃત્તિ અહીં દેખાશે.',
    status: {
      excellent: 'ઉત્તમ',
      on_track: 'સાચા માર્ગે',
      needs_attention: 'સહકારની જરૂર',
      getting_started: 'શરૂઆત',
    },
  },
}

const STATUS_STYLE: Record<
  ProgressStatus,
  { badge: string; hero: string; icon: React.ReactNode }
> = {
  excellent: {
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    hero: 'from-emerald-50 to-emerald-50/30 border-emerald-100 dark:from-emerald-950/30 dark:to-transparent dark:border-emerald-900/40',
    icon: <ThumbsUp size={18} className="text-emerald-600" />,
  },
  on_track: {
    badge: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300',
    hero: 'from-indigo-50 to-indigo-50/30 border-indigo-100 dark:from-indigo-950/30 dark:to-transparent dark:border-indigo-900/40',
    icon: <TrendingUp size={18} className="text-indigo-600" />,
  },
  needs_attention: {
    badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
    hero: 'from-amber-50 to-amber-50/30 border-amber-100 dark:from-amber-950/30 dark:to-transparent dark:border-amber-900/40',
    icon: <AlertCircle size={18} className="text-amber-600" />,
  },
  getting_started: {
    badge: 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
    hero: 'from-sky-50 to-sky-50/30 border-sky-100 dark:from-sky-950/30 dark:to-transparent dark:border-sky-900/40',
    icon: <Rocket size={18} className="text-sky-600" />,
  },
}

/* ---------- Pieces ---------- */

function StatTile({
  icon,
  label,
  value,
  tone = 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300',
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  tone?: string
}) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-neutral-100 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
      <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      <div>
        <p className="text-xl font-black leading-none text-neutral-800 dark:text-neutral-100">
          {value}
        </p>
        <p className="mt-1 text-[11px] font-semibold leading-tight text-neutral-400">{label}</p>
      </div>
    </div>
  )
}

function BulletCard({
  title,
  icon,
  items,
  empty,
  tone,
}: {
  title: string
  icon: React.ReactNode
  items: string[]
  empty?: string
  tone: {
    wrap: string
    title: string
    dot: string
    text: string
  }
}) {
  return (
    <section className={`rounded-2xl border p-4 ${tone.wrap}`}>
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h4 className={`text-sm font-extrabold ${tone.title}`}>{title}</h4>
      </div>
      {items.length > 0 ? (
        <ul className="space-y-2.5">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
              <p className={`text-sm leading-relaxed ${tone.text}`}>{item}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className={`text-sm leading-relaxed opacity-70 ${tone.text}`}>{empty}</p>
      )}
    </section>
  )
}

function ReportSkeleton() {
  return (
    <div className="animate-pulse space-y-4 py-2">
      <div className="h-20 rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
        ))}
      </div>
      <div className="h-32 rounded-2xl bg-neutral-100 dark:bg-neutral-800" />
    </div>
  )
}

function ChildCard({ student }: { student: LinkedStudentSummary }) {
  // Open by default and load straight away — parents should see their child's
  // progress as soon as the page opens, not an empty list of collapsed cards.
  const [isExpanded, setIsExpanded] = useState(true)
  const [progress, setProgress] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const L = LABELS[languageLabel(student.language)]

  const initials = student.name
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const loadProgress = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await generateChildParentSummary(student.id, student.language)
      setProgress(normalizeReport(data))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load progress.')
    } finally {
      setIsLoading(false)
    }
  }, [student.id, student.language])

  useEffect(() => {
    loadProgress()
  }, [loadProgress])

  const completionPct =
    progress && progress.totalChapters > 0
      ? Math.round((progress.chaptersCompleted / progress.totalChapters) * 100)
      : 0

  const scoreTone =
    !progress || progress.totalAttempts === 0
      ? undefined
      : progress.averageScorePct >= 75
        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300'
        : progress.averageScorePct >= 55
          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300'
          : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300'

  const style = progress ? STATUS_STYLE[progress.status] : null
  const summary = progress?.summary

  return (
    <motion.div
      layout
      className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
    >
      <button
        onClick={() => setIsExpanded((v) => !v)}
        className="flex w-full items-center gap-4 p-5 text-left transition-colors hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-lg font-extrabold text-white">
          {initials || '?'}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-neutral-800 dark:text-neutral-100">
            {student.name}
          </p>
          <p className="text-xs text-neutral-400">{student.class_name || L.noClass}</p>
        </div>
        {progress && style && (
          <span
            className={`hidden shrink-0 rounded-full px-3 py-1 text-xs font-extrabold sm:inline-block ${style.badge}`}
          >
            {L.status[progress.status]}
          </span>
        )}
        <ChevronRight
          size={18}
          className={`shrink-0 text-neutral-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-5 pb-5">
          {isLoading && !progress ? (
            <>
              <p className="mb-2 flex items-center gap-2 text-sm text-neutral-400">
                <Loader2 size={16} className="animate-spin" />
                {L.loading}
              </p>
              <ReportSkeleton />
            </>
          ) : error && !progress ? (
            <div className="space-y-2 py-4">
              <p className="text-sm text-red-500">{error}</p>
              <button
                onClick={loadProgress}
                className="text-xs font-bold text-primary hover:underline"
              >
                {L.tryAgain}
              </button>
            </div>
          ) : progress && summary && style ? (
            <div className="space-y-5">
              {/* Headline / overall picture */}
              <div className={`rounded-2xl border bg-gradient-to-br p-4 ${style.hero}`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-indigo-500" />
                    <p className="text-xs font-extrabold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                      {L.report}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold sm:hidden ${style.badge}`}
                  >
                    {L.status[progress.status]}
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0">{style.icon}</span>
                  <p className="text-base font-bold leading-snug text-neutral-800 md:text-lg dark:text-neutral-100">
                    {summary.headline || L.nothingYet}
                  </p>
                </div>
              </div>

              {/* Numbers */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
                <StatTile
                  icon={<Target size={16} />}
                  label={L.avgScore}
                  value={`${progress.averageScorePct}%`}
                  tone={scoreTone}
                />
                <StatTile
                  icon={<BookOpenCheck size={16} />}
                  label={L.chaptersDone}
                  value={`${progress.chaptersCompleted}/${progress.totalChapters || '—'}`}
                />
                <StatTile
                  icon={<PenLine size={16} />}
                  label={L.quizzes}
                  value={progress.totalAttempts}
                />
                <StatTile
                  icon={<Clock size={16} />}
                  label={L.studyTime}
                  value={`${progress.weeklyStudyMinutes}${L.minutes}`}
                />
                <StatTile
                  icon={<Flame size={16} />}
                  label={L.streak}
                  value={`${progress.currentStreakDays}${L.days}`}
                  tone="bg-orange-50 text-orange-500 dark:bg-orange-950/40 dark:text-orange-300"
                />
              </div>

              {progress.totalChapters > 0 && (
                <div>
                  <div className="mb-1.5 flex justify-between text-xs font-semibold text-neutral-400">
                    <span>
                      {L.completion} ·{' '}
                      <span className="text-neutral-500">
                        {L.chaptersOf(progress.chaptersCompleted, progress.totalChapters)}
                      </span>
                    </span>
                    <span className="font-extrabold text-neutral-600 dark:text-neutral-300">
                      {completionPct}%
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Going well / needs attention */}
              {(summary.highlights.length > 0 || summary.focusAreas.length > 0) && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <BulletCard
                    title={L.going}
                    icon={<CheckCircle2 size={17} className="text-emerald-600" />}
                    items={summary.highlights}
                    empty={L.nothingYet}
                    tone={{
                      wrap: 'border-emerald-100 bg-emerald-50/60 dark:border-emerald-900/40 dark:bg-emerald-950/20',
                      title: 'text-emerald-800 dark:text-emerald-300',
                      dot: 'bg-emerald-500',
                      text: 'text-emerald-950/80 dark:text-emerald-100/80',
                    }}
                  />
                  <BulletCard
                    title={L.attention}
                    icon={<AlertCircle size={17} className="text-amber-600" />}
                    items={summary.focusAreas}
                    empty="—"
                    tone={{
                      wrap: 'border-amber-100 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/20',
                      title: 'text-amber-800 dark:text-amber-300',
                      dot: 'bg-amber-500',
                      text: 'text-amber-950/80 dark:text-amber-100/80',
                    }}
                  />
                </div>
              )}

              {/* Home tip */}
              {summary.homeTip && (
                <div className="flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/50 dark:bg-indigo-950/20">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300">
                    <Lightbulb size={18} />
                  </span>
                  <div>
                    <h4 className="text-sm font-extrabold text-indigo-800 dark:text-indigo-300">
                      {L.tip}
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-indigo-950/80 dark:text-indigo-100/80">
                      {summary.homeTip}
                    </p>
                  </div>
                </div>
              )}

              {progress.weakAreas.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Brain size={14} className="text-amber-500" />
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                      {L.concepts}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {progress.weakAreas.map((area) => (
                      <span
                        key={area}
                        className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-400"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-neutral-100 pt-3 dark:border-neutral-800">
                <p className="text-xs text-neutral-400">
                  {L.updated}{' '}
                  {new Date(progress.generatedAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <button
                  onClick={loadProgress}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5 disabled:opacity-60"
                >
                  <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
                  {L.refresh}
                </button>
              </div>
              {error && <p className="text-xs text-red-500">{error}</p>}
            </div>
          ) : null}
        </div>
      )}
    </motion.div>
  )
}

export default function ParentDashboardPage() {
  const { user } = useUserStore()

  const { data: students, isLoading, isError, error } = useQuery({
    queryKey: ['linked-students'],
    queryFn: () => getLinkedStudents(),
    retry: 1,
  })

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-primary mb-1">
          <Users size={18} />
          <p className="text-xs font-bold uppercase tracking-widest">Parent Portal</p>
        </div>
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-100">
          Welcome{user?.name ? `, ${user.name}` : ''}
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Your child&apos;s study time, concept mastery, and a plain-language summary of how
          they&apos;re doing this week.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-neutral-300" size={28} />
        </div>
      ) : isError ? (
        <div className="text-center py-16 bg-red-50/60 dark:bg-red-950/20 rounded-3xl border border-red-100 dark:border-red-900/40">
          <Users className="mx-auto mb-3 text-red-300" size={32} />
          <p className="font-semibold text-red-600 dark:text-red-400">Unable to load linked students</p>
          <p className="text-sm text-red-400 mt-1 max-w-sm mx-auto">
            {error instanceof Error ? error.message : 'Please refresh the page and try again.'}
          </p>
        </div>
      ) : !students || students.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 dark:bg-neutral-900 rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800">
          <Users className="mx-auto mb-3 text-neutral-300" size={32} />
          <p className="font-semibold text-neutral-600 dark:text-neutral-300">
            No students linked yet
          </p>
          <p className="text-sm text-neutral-400 mt-1 max-w-sm mx-auto">
            Ask your school to link your account to your child from the admin panel.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {students.map((student) => (
            <ChildCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  )
}
