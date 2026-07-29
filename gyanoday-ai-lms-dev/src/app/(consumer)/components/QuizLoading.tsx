'use client'

import { motion, Variants } from 'framer-motion'
import React, { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

export const QuizLoading = ({ showDecorations = true }: { showDecorations?: boolean }) => {
  const { t, i18n } = useTranslation()
  const [messageIndex, setMessageIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  // Use Intl.Segmenter to split text into grapheme clusters (correct for Indic/Emoji)
  const preparingText = t('common.quiz.preparing')
  const letters = React.useMemo(() => {
    try {
      const segmenter = new (Intl as any).Segmenter(i18n.language, { granularity: 'grapheme' })
      return Array.from(segmenter.segment(preparingText)).map((s: any) => s.segment)
    } catch (e) {
      // Fallback for older browsers
      return Array.from(preparingText)
    }
  }, [preparingText, i18n.language])

  const isIndic = i18n.language === 'hi' || i18n.language === 'gu'

  // Fallback messages
  const localizedSequence = t('common.quiz.loading_sequence', { returnObjects: true })
  const messages = Array.isArray(localizedSequence) ? localizedSequence : []

  useEffect(() => {
    if (messages.length === 0) return

    const interval = setInterval(() => {
      setIsVisible(false)
      setTimeout(() => {
        setMessageIndex((prev: number) => (prev + 1) % messages.length)
        setIsVisible(true)
      }, 500)
    }, 3000)

    return () => clearInterval(interval)
  }, [messages.length])

  const container: Variants = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.04 * i },
    }),
  }

  const child: Variants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 100,
        repeat: Infinity,
        repeatType: 'reverse',
        duration: 1.5,
      },
    },
    hidden: {
      opacity: 0,
      y: 10,
    },
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center bg-transparent px-4',
        showDecorations ? 'gap-10 py-12' : 'gap-4 py-4'
      )}
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className={cn(
          'flex flex-wrap justify-center font-black text-primary py-2',
          isIndic ? 'tracking-normal' : 'tracking-tighter',
          showDecorations ? 'text-2xl md:text-4xl' : 'text-2xl md:text-2xl'
        )}
      >
        {letters.map((letter, index) => (
          <motion.span variants={child} key={index} className="inline-block">
            {letter === ' ' ? '\u00A0' : letter}
          </motion.span>
        ))}
      </motion.div>

      <div className={cn('text-center space-y-2 max-w-md', showDecorations ? 'h-12' : 'h-8')}>
        <p
          className={cn(
            'text-neutral-400 font-medium transition-all duration-500 transform italic',
            showDecorations ? 'text-lg md:text-md' : 'text-base md:text-lg',
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          )}
        >
          {messages[messageIndex] || t('common.quiz.generating_desc')}
        </p>
      </div>

      {/* Decorative elements to make it feel premium */}
      {showDecorations && (
        <>
          <div className="fixed top-20 left-10 w-24 h-24 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="fixed bottom-20 right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}
    </div>
  )
}
