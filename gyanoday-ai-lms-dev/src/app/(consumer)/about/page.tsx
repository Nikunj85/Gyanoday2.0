'use client'

import { CheckCircle2 } from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

import { MotionContainer, MotionWrapper } from '@/lib/animations/MotionWrapper'

export default function About() {
  const { t } = useTranslation()

  const featuresData = t('common.about_page.features', { returnObjects: true })
  const features = Array.isArray(featuresData) ? featuresData : []

  return (
    <main className="pb-10 lg:pb-6 pt-13 lg:pt-32 flex flex-col items-center justify-center bg-background transition-colors duration-300">
      <div className="container mx-auto px-4 lg:px-20">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-20">
          {/* Left Side - Image */}
          <MotionWrapper
            animation="fadeInLeft"
            duration={1.2}
            className="w-full lg:w-1/2 flex justify-center lg:justify-start"
          >
            <div className="relative w-full max-w-[560px] aspect-square">
              <Image
                src="/study-group.png"
                alt="Students learning together"
                fill
                className="object-contain"
                priority
              />
            </div>
          </MotionWrapper>

          {/* Right Side - Content */}
          <div className="w-full lg:w-1/2 space-y-6 md:space-y-8">
            <MotionContainer staggerChildren={0.2}>
              <MotionWrapper animation="fadeInUp" className="space-y-2 md:space-y-3">
                <h3 className="text-carrot-orange  font-bold text-lg md:text-2xl">
                  {t('common.about_page.label')}
                </h3>
                <h1 className="text-philosophy dark:text-lavender-mist text-3xl md:text-4xl lg:text-2xl  font-bold leading-tight">
                  {t('common.about_page.headline')}
                </h1>
              </MotionWrapper>

              <MotionWrapper
                animation="fadeInUp"
                delay={0.2}
                className="space-y-5 text-neutral-600 dark:text-neutral-400 text-sm md:text-base leading-relaxed font-medium mt-3   "
              >
                <p>{t('common.about_page.paragraph1')}</p>
                <p>{t('common.about_page.paragraph2')}</p>
              </MotionWrapper>

              {/* Features Grid */}
              <MotionContainer
                className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3 mt-10"
                staggerChildren={0.1}
                delayChildren={0.4}
              >
                {features.map((feature, index) => (
                  <MotionWrapper
                    key={index}
                    animation="scaleIn"
                    className="flex items-center space-x-3 bg-ghost-white dark:bg-neutral-800 p-3 md:p-4 rounded-xl border border-philosophy/5 dark:border-neutral-800 transition-colors duration-300"
                  >
                    <CheckCircle2 className="w-5 h-5 text-philosophy dark:text-lavender-mist shrink-0" />
                    <span className="text-philosophy dark:text-lavender-mist font-bold  text-xs md:text-sm">
                      {feature}
                    </span>
                  </MotionWrapper>
                ))}
              </MotionContainer>
            </MotionContainer>
          </div>
        </div>
      </div>
    </main>
  )
}
