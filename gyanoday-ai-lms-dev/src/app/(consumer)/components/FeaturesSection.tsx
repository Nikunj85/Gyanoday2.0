'use client'

import { BarChart3, BookOpenCheck, Flame, MessageCircleQuestion, Target, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { MotionWrapper } from '@/lib/animations/MotionWrapper'
import { hoverLift } from '@/lib/animations/variants'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  iconBg: string
  index?: number
}

const FeatureCard = ({ icon, title, description, iconBg, index = 0 }: FeatureCardProps) => (
  <MotionWrapper
    animation="fadeInUp"
    delay={index * 0.1}
    duration={0.9}
    whileHover={hoverLift}
    className="bg-white dark:bg-neutral-900 rounded-[24px] p-6 border border-neutral-100 dark:border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] h-full"
  >
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm mb-4"
      style={{ backgroundColor: iconBg }}
    >
      <div className="text-white drop-shadow-sm">{icon}</div>
    </div>
    <h3 className="text-[1.05rem] font-bold text-primary-black dark:text-neutral-100 leading-snug mb-2">
      {title}
    </h3>
    <p className="text-neutral-500 dark:text-neutral-400 text-[0.9rem] leading-[1.6] font-medium">
      {description}
    </p>
  </MotionWrapper>
)

/**
 * A real inventory of what's actually shipped — not aspirational
 * marketing copy. Consolidated to 6 cards by grouping closely-related
 * capabilities together (e.g. voice/photo input folded into the tutor
 * card; streaks, study time, and subject tracking folded into one
 * progress-dashboard card) rather than one card per individual feature.
 */
export default function FeaturesSection() {
  const { t } = useTranslation()

  const cardTranslations = t('common.features_section.cards', { returnObjects: true }) as {
    title: string
    description: string
  }[]

  const cards = [
    {
      icon: <MessageCircleQuestion size={24} strokeWidth={2.2} />,
      title: cardTranslations[0]?.title || 'A Socratic AI Tutor, Not an Answer Key',
      description:
        cardTranslations[0]?.description ||
        "Siksha guides students to the answer with hints and questions instead of handing it over and only steps in with the full explanation once a student has genuinely tried. It stays focused on the exact chapter open, redirects anything off-topic, and understands a spoken question or a photo of a handwritten problem just as well as typed text.",
      iconBg: '#8B7CD8',
    },
    {
      icon: <Target size={24} strokeWidth={2.2} />,
      title: cardTranslations[1]?.title || 'Adaptive Quizzes That Target Weak Spots',
      description:
        cardTranslations[1]?.description ||
        'Quizzes adjust to what a student has actually struggled with, and students can generate a focused quiz on a single concept they want to drill. Every result comes with a clean scorecard and a full answer review.',
      iconBg: '#E58B99',
    },
    {
      icon: <BookOpenCheck size={24} strokeWidth={2.2} />,
      title: cardTranslations[2]?.title || 'Living Smart Notes, With Your Own Notes Too',
      description:
        cardTranslations[2]?.description ||
        'Every chapter gets notes in three layers a written Core, click-to-reveal Active-Recall flashcards, and instant Feedback quizzes woven right in. On top of that, students can jot a personal note on any chapter or star it to flag it for revision, right from the chapter list.',
      iconBg: '#73C6BE',
    },
    {
      icon: <BarChart3 size={24} strokeWidth={2.2} />,
      title: cardTranslations[3]?.title || 'A Progress Dashboard Built on Real Data',
      description:
        cardTranslations[3]?.description ||
        "Every subject shows its own completion %, strengths, weaknesses, and ranked topics to revise tap any of them for the real quiz score behind it. A weekly study-time chart and a Duolingo-style daily streak, both built from actual activity, keep the full picture in one place.",
      iconBg: '#D9754E',
    },
    {
      icon: <Flame size={24} strokeWidth={2.2} />,
      title: cardTranslations[4]?.title || 'Daily Streaks & Gentle Reminders',
      description:
        cardTranslations[4]?.description ||
        "A personalized, encouraging progress summary greets students on the dashboard, plus a gentle nudge notification on days they haven't studied yet enough to build consistency without adding pressure.",
      iconBg: '#D9A441',
    },
    {
      icon: <Users size={24} strokeWidth={2.2} />,
      title: cardTranslations[5]?.title || 'A Portal for Parents, Too',
      description:
        cardTranslations[5]?.description ||
        "Parents get their own simple dashboard: study time, concept mastery, strengths and weaknesses per subject, and a plain-language summary of how their child is actually doing no digging required.",
      iconBg: '#6BAF8D',
    },
  ]

  return (
    <section className="py-20 px-6 md:px-16 lg:px-24 bg-background">
      <MotionWrapper animation="fadeInUp" duration={0.8} className="text-center max-w-2xl mx-auto mb-14">
        <p className="text-primary font-bold uppercase tracking-widest text-sm mb-3">
          {t('common.features_section.eyebrow', 'What Gyanoday AI Actually Does')}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-primary-black dark:text-neutral-100">
          {t('common.features_section.title', 'Built to guide, not just inform')}
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-4 text-[1.05rem] leading-relaxed">
          {t(
            'common.features_section.subtitle',
            'Every feature below is live in the app today not a roadmap.'
          )}
        </p>
      </MotionWrapper>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {cards.map((card, index) => (
          <FeatureCard key={card.title} index={index} {...card} />
        ))}
      </div>
    </section>
  )
}
