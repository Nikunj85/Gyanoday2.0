'use client'

import {
  ArrowRight,
  BookOpen,
  BookText,
  Calculator,
  Check,
  FlaskConical,
  Globe,
  Laptop,
  Palette,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { localizeSubjectName } from '@/lib/subject-names'
import { Subject } from '@/types/subjects'

interface SubjectCardProps {
  subject: Subject
  index: number
  completedChapters?: number
  totalChapters?: number
}

type Lang = 'en' | 'hi' | 'gu'

interface Copy {
  notStarted: string
  inProgress: string
  completed: string
  start: string
  continue: string
  review: string
  lessonsOf: (done: number, total: number) => string
  noLessons: string
}

// Built in so the card is correct in all three mediums even before locale files get new keys.
export const SUBJECT_CARD_COPY: Record<Lang, Copy> = {
  en: {
    notStarted: 'Not started',
    inProgress: 'In progress',
    completed: 'Completed',
    start: 'Start learning',
    continue: 'Continue',
    review: 'Review',
    lessonsOf: (d, t) => `${d} of ${t} lessons`,
    noLessons: 'No lessons yet',
  },
  hi: {
    notStarted: 'शुरू नहीं हुआ',
    inProgress: 'जारी है',
    completed: 'पूरा हुआ',
    start: 'सीखना शुरू करें',
    continue: 'जारी रखें',
    review: 'दोहराएँ',
    lessonsOf: (d, t) => `${t} में से ${d} पाठ`,
    noLessons: 'अभी कोई पाठ नहीं',
  },
  gu: {
    notStarted: 'શરૂ થયું નથી',
    inProgress: 'ચાલુ છે',
    completed: 'પૂર્ણ',
    start: 'શીખવાનું શરૂ કરો',
    continue: 'ચાલુ રાખો',
    review: 'ફરી જુઓ',
    lessonsOf: (d, t) => `${t} માંથી ${d} પાઠ`,
    noLessons: 'હજી કોઈ પાઠ નથી',
  },
}

/** Picks an icon (or the subject's own script letter) from the subject name. */
function SubjectGlyph({ name }: { name: string }) {
  const n = name.toLowerCase()
  const common = { size: 26, strokeWidth: 2.2 }

  if (/hindi|हिन्दी|हिंदी/.test(n)) return <span className="text-2xl font-black leading-none">अ</span>
  if (/gujarati|ગુજરાતી/.test(n)) return <span className="text-2xl font-black leading-none">ગ</span>
  if (/sanskrit|संस्कृत/.test(n)) return <span className="text-2xl font-black leading-none">सं</span>
  if (/math|गणित|ગણિત/.test(n)) return <Calculator {...common} />
  if (/science|physics|chemistry|biology|विज्ञान|વિજ્ઞાન/.test(n)) return <FlaskConical {...common} />
  if (/english/.test(n)) return <BookText {...common} />
  if (/social|history|geography|civics|सामाजिक|સામાજિક/.test(n)) return <Globe {...common} />
  if (/computer|\bit\b|coding/.test(n)) return <Laptop {...common} />
  if (/art|drawing|craft/.test(n)) return <Palette {...common} />
  return <BookOpen {...common} />
}

export const SubjectCard = ({
  subject,
  index,
  completedChapters = 0,
  totalChapters = 0,
}: SubjectCardProps) => {
  const { i18n } = useTranslation()
  const displayName = localizeSubjectName(subject.name, i18n.language)
  const lang = ((i18n.language || 'en').split('-')[0] as Lang) in SUBJECT_CARD_COPY
    ? ((i18n.language || 'en').split('-')[0] as Lang)
    : 'en'
  const copy = SUBJECT_CARD_COPY[lang]

  const progress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0
  const isCompleted = totalChapters > 0 && completedChapters >= totalChapters
  const isStarted = completedChapters > 0
  const baseColor = subject.color_code || '#B188C0'

  // Fade the card in and grow the progress bar from 0 on first paint.
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])
  const barWidth = mounted ? progress : 0

  const statusLabel = isCompleted ? copy.completed : isStarted ? copy.inProgress : copy.notStarted
  const ctaLabel = isCompleted ? copy.review : isStarted ? copy.continue : copy.start

  return (
    <Link
      href={`/subjects/${subject.id}`}
      className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-offset-2"
      style={{ ['--tw-ring-color' as string]: `${baseColor}66` }}
      aria-label={`${displayName}: ${copy.lessonsOf(completedChapters, totalChapters)}`}
    >
      <div
        className={`relative flex h-full min-h-[220px] flex-col overflow-hidden rounded-3xl p-5 text-white shadow-lg transition-all duration-500 group-hover:-translate-y-1.5 group-hover:shadow-2xl motion-reduce:transition-none md:p-6 ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
        style={{
          backgroundColor: baseColor,
          backgroundImage: `linear-gradient(140deg, ${baseColor} 0%, color-mix(in srgb, ${baseColor} 68%, #000) 100%)`,
          transitionDelay: `${Math.min(index, 8) * 70}ms`,
        }}
      >
        {/* Decorative shapes */}
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/10 transition-transform duration-500 group-hover:scale-125" />
        <div className="pointer-events-none absolute -bottom-12 -left-8 h-32 w-32 rounded-full bg-white/10" />

        {/* Top row: icon + status */}
        <div className="relative flex items-start justify-between gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 shadow-inner ring-1 ring-white/30 backdrop-blur-sm">
            <SubjectGlyph name={subject.name} />
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-xs font-bold ring-1 ring-white/25 backdrop-blur-sm">
            {isCompleted ? (
              <Check size={13} strokeWidth={4} />
            ) : (
              <span
                className={`h-2 w-2 rounded-full ${isStarted ? 'bg-white' : 'bg-white/50'}`}
              />
            )}
            {statusLabel}
          </span>
        </div>

        {/* Name + lessons */}
        <div className="relative mt-5 flex-1">
          <h3 className="line-clamp-2 text-2xl font-extrabold leading-tight drop-shadow-sm md:text-[1.7rem]">
            {displayName}
          </h3>
          <p className="mt-1.5 text-sm font-medium text-white/85 md:text-base">
            {totalChapters > 0 ? copy.lessonsOf(completedChapters, totalChapters) : copy.noLessons}
          </p>
        </div>

        {/* Progress */}
        <div className="relative mt-5">
          <div className="mb-1.5 flex items-center justify-between text-xs font-bold text-white/90">
            <span>{progress}%</span>
          </div>
          <div
            className="h-3 w-full overflow-hidden rounded-full bg-black/20 ring-1 ring-white/15"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-white shadow-sm transition-[width] duration-1000 ease-out"
              style={{ width: `${barWidth}%` }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="relative mt-4 flex items-center justify-between border-t border-white/20 pt-3">
          <span className="text-sm font-bold md:text-base">{ctaLabel}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 transition-all duration-300 group-hover:translate-x-1 group-hover:bg-white group-hover:text-neutral-800">
            <ArrowRight size={16} strokeWidth={3} />
          </span>
        </div>
      </div>

    </Link>
  )
}
