'use client'

import {
  BarChart3,
  BookOpenText,
  Bot,
  Camera,
  ClipboardCheck,
  Clock,
  FileText,
  Flame,
  Languages,
  NotebookPen,
  Sparkles,
  Target,
  Users,
  Zap,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { MotionContainer, MotionWrapper } from '@/lib/animations/MotionWrapper'

/**
 * Everything below is a feature that already ships in the app (chatbot, voice/OCR,
 * adaptive + topic quizzes, review drawer, smart notes, notes + revision star,
 * progress tracking, streaks + reminders, parent portal, three mediums).
 * Text lives under `common.features.items.<id>` so each medium gets its own copy.
 */
const FEATURES = [
  {
    id: 'tutor',
    icon: Bot,
    color: '#7C6FE0',
    title: 'Socratic AI Tutor',
    desc: 'Ask doubts inside any chapter. The tutor guides you step by step with questions instead of handing over answers, and stays on your class, subject and chapter.',
  },
  {
    id: 'streaming',
    icon: Zap,
    color: '#F59E0B',
    title: 'Instant Streaming Answers',
    desc: 'Replies appear word by word as they are written, so there are no blank loading screens while you wait.',
  },
  {
    id: 'voice_ocr',
    icon: Camera,
    color: '#EC4899',
    title: 'Voice & Photo Input',
    desc: 'Speak your question, listen to the answer read aloud, or snap a photo of a handwritten or textbook problem to ask the tutor.',
  },
  {
    id: 'quiz',
    icon: ClipboardCheck,
    color: '#10B981',
    title: 'Adaptive AI Quizzes',
    desc: 'Chapter quizzes that find your weak concepts, track conceptual gaps and recommend what to revise next.',
  },
  {
    id: 'topic_practice',
    icon: Target,
    color: '#EF4444',
    title: 'Targeted Topic Practice',
    desc: 'Pick any topic or concept and drill just that, with a clean scorecard and a Review Answers drawer to learn from every mistake.',
  },
  {
    id: 'smart_notes',
    icon: Sparkles,
    color: '#8B5CF6',
    title: 'Living Smart Notes',
    desc: 'Notes in three layers: the core chapter explained, tap-to-reveal recall cards, and instant mini-quizzes to check your understanding.',
  },
  {
    id: 'pdf',
    icon: FileText,
    color: '#0EA5E9',
    title: 'Chapter-wise PDF Notes',
    desc: 'Class-wise subjects and chapters with PDF study material you can zoom, read full screen and revisit anytime.',
  },
  {
    id: 'my_notes',
    icon: NotebookPen,
    color: '#F97316',
    title: 'My Notes & Revision Star',
    desc: 'Write personal notes for any chapter and star chapters you want to revise, all saved to your account.',
  },
  {
    id: 'progress',
    icon: BarChart3,
    color: '#14B8A6',
    title: 'Smart Progress Tracking',
    desc: 'Subject-wise progress with strengths, weaknesses and revision topics, plus a learning-journey map of every chapter.',
  },
  {
    id: 'study_time',
    icon: Clock,
    color: '#6366F1',
    title: 'Study Time Insights',
    desc: 'See how long you studied each day this week and each week this month, tracked from your quiz activity.',
  },
  {
    id: 'streak',
    icon: Flame,
    color: '#F97316',
    title: 'Daily Streak & Gentle Reminders',
    desc: 'A 7-day streak keeps you consistent, with an optional friendly reminder if you have not studied yet today.',
  },
  {
    id: 'ai_summary',
    icon: BookOpenText,
    color: '#D946EF',
    title: 'Siksha Inspire Summaries',
    desc: 'Encouraging AI summaries of your journey and a fresh daily motivation quote to push you past roadblocks.',
  },
  {
    id: 'parent',
    icon: Users,
    color: '#0D9488',
    title: 'Parent Portal',
    desc: 'Parents get a simple login to follow study time, streaks, quiz scores and concept mastery, with a clear professional summary.',
  },
  {
    id: 'mediums',
    icon: Languages,
    color: '#2563EB',
    title: 'English, Hindi & Gujarati',
    desc: 'Choose your medium once. Subjects, chapters, quizzes, notes and the whole app then appear in your own language.',
  },
] as const

export default function FeaturesSection() {
  const { t } = useTranslation()

  return (
    <section
      id="features"
      className="relative bg-background py-20 transition-colors duration-300 md:py-28"
    >
      <div className="container mx-auto px-4 md:px-10 lg:px-20">
        <MotionWrapper animation="fadeInUp" duration={1.1} className="mx-auto mb-12 max-w-3xl text-center md:mb-16">
          <p className="text-lg font-bold tracking-wide text-primary-hover dark:text-queen-pink">
            {t('common.features.label', 'Features')}
          </p>
          <h2 className="mt-2 text-3xl font-bold leading-tight text-philosophy dark:text-lavender-mist md:text-4xl">
            {t('common.features.headline', 'Everything a student needs to learn with confidence')}
          </h2>
          <p className="mt-4 text-base font-medium leading-relaxed text-neutral-500 dark:text-neutral-400 md:text-lg">
            {t(
              'common.features.subtitle',
              'From AI tutoring and smart notes to progress tracking and a parent portal, all in one place and in your own medium.'
            )}
          </p>
        </MotionWrapper>

        <MotionContainer
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-3"
          staggerChildren={0.08}
        >
          {FEATURES.map(({ id, icon: Icon, color, title, desc }) => (
            <MotionWrapper
              key={id}
              animation="fadeInUp"
              className="group flex h-full flex-col gap-4 rounded-3xl border border-neutral-100 bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                style={{ backgroundColor: color }}
              >
                <Icon size={24} strokeWidth={2.2} />
              </span>
              <div>
                <h3 className="text-lg font-bold leading-snug text-neutral-900 dark:text-neutral-100">
                  {t(`common.features.items.${id}.title`, title)}
                </h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-500 dark:text-neutral-400">
                  {t(`common.features.items.${id}.desc`, desc)}
                </p>
              </div>
            </MotionWrapper>
          ))}
        </MotionContainer>
      </div>
    </section>
  )
}
