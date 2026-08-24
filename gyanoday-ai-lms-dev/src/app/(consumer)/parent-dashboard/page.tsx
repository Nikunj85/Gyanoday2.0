'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BookOpenCheck,
  Brain,
  ChevronRight,
  Clock,
  Flame,
  Loader2,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'
import { useState } from 'react'

import {
  ChildProgressSummary,
  generateChildParentSummary,
  getLinkedStudents,
  LinkedStudentSummary,
} from '@/app/actions/parent-actions'
import { useUserStore } from '@/store/user-store'

function MetricPill({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
}) {
  return (
    <div className="flex items-center gap-2.5 bg-neutral-50 dark:bg-neutral-800/60 rounded-xl px-3.5 py-2.5">
      <span className="text-primary shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-neutral-800 dark:text-neutral-100 leading-tight">
          {value}
        </p>
        <p className="text-[11px] text-neutral-400 leading-tight">{label}</p>
      </div>
    </div>
  )
}

function ChildCard({ student }: { student: LinkedStudentSummary }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [progress, setProgress] = useState<(ChildProgressSummary & { summary: string }) | null>(
    null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = student.name
    ?.split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleExpand = async () => {
    const next = !isExpanded
    setIsExpanded(next)
    if (next && !progress && !isLoading) {
      setIsLoading(true)
      setError(null)
      try {
        const data = await generateChildParentSummary(student.id, student.language)
        setProgress(data)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load progress.')
      } finally {
        setIsLoading(false)
      }
    }
  }

  const completionPct =
    progress && progress.totalChapters > 0
      ? Math.round((progress.chaptersCompleted / progress.totalChapters) * 100)
      : 0

  return (
    <motion.div
      layout
      className="border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-3xl overflow-hidden"
    >
      <button
        onClick={handleExpand}
        className="w-full flex items-center gap-4 p-5 text-left hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-extrabold text-lg shrink-0">
          {initials || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold text-neutral-800 dark:text-neutral-100">
            {student.name}
          </p>
          <p className="text-xs text-neutral-400">
            {student.class_name || 'No class assigned'}
          </p>
        </div>
        <ChevronRight
          size={18}
          className={`text-neutral-300 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-5 pb-5">
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-neutral-400 py-6">
              <Loader2 size={16} className="animate-spin" />
              Compiling this week&apos;s progress…
            </div>
          ) : error ? (
            <p className="text-sm text-red-500 py-4">{error}</p>
          ) : progress ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <MetricPill
                  icon={<Target size={16} />}
                  label="Avg. score"
                  value={`${progress.averageScorePct}%`}
                />
                <MetricPill
                  icon={<BookOpenCheck size={16} />}
                  label="Chapters done"
                  value={`${progress.chaptersCompleted}/${progress.totalChapters || '—'}`}
                />
                <MetricPill
                  icon={<Clock size={16} />}
                  label="Study time (7d)"
                  value={`${progress.weeklyStudyMinutes}m`}
                />
                <MetricPill
                  icon={<Flame size={16} />}
                  label="Current streak"
                  value={`${progress.currentStreakDays}d`}
                />
              </div>

              {progress.totalChapters > 0 && (
                <div>
                  <div className="flex justify-between text-xs font-semibold text-neutral-400 mb-1.5">
                    <span>Course completion</span>
                    <span>{completionPct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      style={{ width: `${completionPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Professional AI summary */}
              <div className="bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={14} className="text-indigo-500" />
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-500">
                    Progress Summary
                  </p>
                </div>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-line">
                  {progress.summary}
                </p>
              </div>

              {progress.weakAreas.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Brain size={14} className="text-amber-500" />
                    <p className="text-xs font-bold uppercase tracking-wide text-neutral-400">
                      Concepts to reinforce
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {progress.weakAreas.map((area) => (
                      <span
                        key={area}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </motion.div>
  )
}

export default function ParentDashboardPage() {
  const { user } = useUserStore()

  const { data: students, isLoading } = useQuery({
    queryKey: ['linked-students'],
    queryFn: () => getLinkedStudents(),
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
          Tap a child to see this week&apos;s study time, concept mastery, and a plain-language
          summary of how they&apos;re doing.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="animate-spin text-neutral-300" size={28} />
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
