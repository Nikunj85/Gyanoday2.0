'use client'

import { Play } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'

import { MotionContainer, MotionWrapper } from '@/lib/animations/MotionWrapper'
import { useUserStore } from '@/store/user-store'

import mock1 from '../../../../public/mock1.png'

export default function Hero() {
  const { t } = useTranslation()
  const user = useUserStore((state) => state.user)

  return (
    <section className="relative min-h-[calc(100dvh-70px)] lg:min-h-[calc(100vh-80px)] flex items-center overflow-hidden bg-background">
      <div className="container mx-auto px-4 md:px-10 lg:px-20 relative z-20 py-4 lg:py-0 scale-95 lg:scale-100 transition-transform duration-300">
        <div className="flex flex-col-reverse lg:flex-row items-center gap-8 lg:gap-12">
          {/* Left Column: Text Content */}
          <MotionContainer
            className="w-full lg:w-[45%] space-y-4 md:space-y-8"
            staggerChildren={0.3}
            delayChildren={0.5}
          >
            <div className="space-y-6 md:space-y-12">
              <MotionWrapper animation="springUp" custom={{ stiffness: 70, damping: 25 }}>
                <h1 className="text-3xl md:text-4xl max-lg:text-center lg:text-6xl font-bold leading-[1.2] md:leading-[1.4] lg:leading-[1.5] tracking-tight text-primary-black dark:text-white">
                  <span className="block">{t('common.hero.title')}</span>
                  <span className="block">{t('common.hero.title-1')}</span>
                  <span className="block text-2xl md:text-4xl lg:text-5xl leading-[1.5] md:leading-[1.4] lg:leading-[1.5]">
                    {t('common.hero.title-2')}
                  </span>
                </h1>
              </MotionWrapper>

              <MotionWrapper animation="fadeInLeft" delay={0.8} duration={1.5}>
                <div className="flex max-lg:justify-center gap-4">
                  <div className="w-1 bg-neutral-300 dark:bg-neutral-700 rounded-full shrink-0"></div>
                  <p className="text-neutral-500 dark:text-neutral-400 text-sm md:text-lg font-medium max-w-lg leading-relaxed">
                    {t('common.hero.subtitle')}
                  </p>
                </div>
              </MotionWrapper>
            </div>

            <MotionContainer
              className="flex flex-col max-lg:justify-center sm:flex-row items-center gap-4 md:gap-6 pt-6 md:pt-12"
              staggerChildren={0.2}
              delayChildren={1.2}
            >
              <MotionWrapper animation="springScale">
                <Link
                  href={user ? '/dashboard' : '/register'}
                  className="block w-full sm:w-auto bg-primary hover:bg-primary/80 text-white px-8 md:px-10 py-3.5 md:py-4 rounded-full font-semibold text-base md:text-lg transition-all shadow-lg text-center whitespace-nowrap"
                >
                  {t('common.hero.get_started_free')}
                </Link>
              </MotionWrapper>

              <MotionWrapper animation="springScale">
                <button className="flex items-center gap-3 group whitespace-nowrap">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-philosophy/10 dark:bg-philosophy/20 rounded-full flex items-center justify-center text-philosophy group-hover:scale-110 transition-transform shadow-sm">
                    <Play className="fill-philosophy w-4 h-4 md:w-5 md:h-5 ml-1" />
                  </div>
                  <span className="text-primary-black dark:text-neutral-100 font-semibold text-base md:text-lg">
                    {t('common.hero.watch_demo')}
                  </span>
                </button>
              </MotionWrapper>
            </MotionContainer>
          </MotionContainer>

          {/* Right Column: Illustrative Visuals */}
          <div className="w-full lg:w-[45%] relative">
            <MotionWrapper
              animation="fadeInRight"
              delay={0.6}
              duration={1.8}
              className="relative w-full max-w-[400px] md:max-w-[600px] lg:max-w-[900px] mx-auto lg:mr-[-80px] -mt-5 lg:mt-0"
            >
              <Image
                src={mock1}
                alt="Student learning mockup"
                className="w-full h-auto object-contain scale-100 md:scale-110 lg:scale-125"
                priority
              />
            </MotionWrapper>
          </div>
        </div>
      </div>

      {/* Decorative scattered shapes (optional additions for extra depth, matching the image theme) */}
      <div className="absolute top-[20%] right-[10%] w-3 h-3 bg-[#E0DDF0] rotate-45 hidden lg:block opacity-50"></div>
      <div className="absolute bottom-[20%] left-[45%] w-3 h-3 bg-primary rotate-45 hidden lg:block"></div>
      <div className="absolute top-[15%] right-[35%] w-4 h-4 bg-[#B8A3D8] opacity-30 rounded-sm hidden lg:block"></div>
    </section>
  )
}
