'use client'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

import { MotionContainer, MotionWrapper } from '@/lib/animations/MotionWrapper'

export default function WhyGyanoday() {
  const { t } = useTranslation()

  return (
    <section className="relative mt-5 bg-background z-0 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-10 lg:px-20">
        {/* Section Heading */}
        <MotionWrapper
          animation="fadeInUp"
          duration={1.2}
          className="flex items-center justify-center gap-6 mb-12 md:mb-20"
        >
          <MotionWrapper
            animation={{
              hidden: { height: 0 },
              visible: { height: 96, transition: { duration: 1.2, ease: 'easeInOut' } },
            }}
            className="w-[4px] h-12 md:h-24 bg-neutral-300 dark:bg-neutral-700/50 rounded-full"
          />
          <h2 className="text-3xl md:text-4xl font-extrabold text-center text-philosophy dark:text-lavender-mist shrink-0">
            {t('common.why_gyanoday.heading')}
          </h2>
          <MotionWrapper
            animation={{
              hidden: { height: 0 },
              visible: { height: 96, transition: { duration: 1.2, ease: 'easeInOut' } },
            }}
            className="w-[4px] h-12 md:h-24 bg-neutral-300 dark:bg-neutral-700/50 rounded-full"
          />
        </MotionWrapper>

        <div className="flex flex-col md:flex-row items-center justify-between gap-12 lg:gap-24">
          {/* Left Content: Text Explanation */}
          <MotionContainer
            className="w-full md:w-1/2 space-y-8 md:space-y-10"
            staggerChildren={0.3}
            delayChildren={0.5}
          >
            <MotionWrapper animation="fadeInLeft" duration={1.2}>
              <p className="text-lg md:text-[26px] leading-relaxed text-neutral-400 dark:text-neutral-500">
                {t('common.why_gyanoday.line1')}{' '}
                <span className="text-philosophy dark:text-lavender-mist font-bold">
                  {t('common.why_gyanoday.line2')},
                </span>
                <br className="hidden md:block" />
                {t('common.why_gyanoday.line3')}{' '}
                <span className="text-philosophy/70 dark:text-lavender-mist/70 font-bold">
                  {t('common.why_gyanoday.line4')}
                </span>
              </p>
            </MotionWrapper>

            <MotionWrapper animation="fadeInLeft" delay={0.3} duration={1.2}>
              <p className="text-lg md:text-[23px] leading-relaxed text-neutral-400 dark:text-neutral-500">
                {t('common.why_gyanoday.line5')}{' '}
                <span className="text-philosophy/70 dark:text-lavender-mist/70 font-bold">
                  {t('common.why_gyanoday.line6')}
                </span>{' '}
                {t('common.why_gyanoday.line7')}{' '}
                <span className="text-philosophy dark:text-lavender-mist font-bold">
                  {t('common.why_gyanoday.line8')}
                </span>
                <br className="hidden md:block" />
                {t('common.why_gyanoday.line9')}{' '}
                <span className="text-philosophy/70 dark:text-lavender-mist/70 font-bold">
                  {t('common.why_gyanoday.line10')}
                </span>
              </p>
            </MotionWrapper>
          </MotionContainer>

          {/* Right Content: Image from public/whyGyanoday.png */}
          <MotionWrapper
            animation="fadeInRight"
            delay={0.4}
            duration={1.2}
            className="w-full md:w-1/2 flex justify-center md:justify-end"
          >
            <div className="relative w-full max-w-[480px]">
              <Image
                src="/whyGyanoday.png"
                alt="Why Gyanoday Signpost"
                width={600}
                height={600}
                className="w-full h-auto object-contain"
                priority
              />
            </div>
          </MotionWrapper>
        </div>
      </div>
    </section>
  )
}
