'use client'

import Image from 'next/image'
import { useTranslation } from 'react-i18next'

import { MotionContainer, MotionWrapper } from '@/lib/animations/MotionWrapper'

export default function AboutSection() {
  const { t } = useTranslation()

  const paragraphsData = t('common.about.paragraphs', { returnObjects: true })
  const paragraphs = Array.isArray(paragraphsData) ? paragraphsData : []

  return (
    <section className="relative py-20 bg-background overflow-hidden z-10 transition-colors duration-300">
      <div className="container mx-auto px-4 md:px-10 lg:px-20 relative z-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left Side: 4-Kid Grid Image */}
          <MotionWrapper
            animation="fadeInLeft"
            duration={1.8}
            delay={0.3}
            className="w-full lg:w-[35%] flex items-center justify-center"
          >
            <Image
              src="/kids.png"
              alt="Students learning with Gyanoday AI"
              width={700}
              height={600}
              className="w-full h-auto object-contain"
              priority
            />
          </MotionWrapper>

          {/* Vertical Divider (Hidden on mobile) */}
          <MotionWrapper
            animation="scaleIn"
            duration={1.5}
            delay={0.6}
            className="hidden lg:block w-[1.5px] h-64 bg-neutral-300 dark:bg-neutral-700 self-center"
          />

          {/* Right Side: Text Content Area */}
          <MotionContainer
            className="w-full lg:w-[51%] space-y-6 text-center lg:text-left"
            staggerChildren={0.3}
            delayChildren={0.8}
          >
            <div className="space-y-1">
              <MotionWrapper animation="fadeInRight" duration={1.2}>
                <p className="text-philosophy dark:text-lavender-mist font-bold text-lg lg:text-xl tracking-wide">
                  {t('common.about.label')}
                </p>
              </MotionWrapper>
              <MotionWrapper animation="fadeInRight" delay={0.3} duration={1.2}>
                <h2 className="text-3xl md:text-4xl lg:text-[2.2rem] font-bold text-primary-hover dark:text-queen-pink leading-[1.3]">
                  {t('common.about.headline')}
                </h2>
              </MotionWrapper>
            </div>

            <div className="space-y-2">
              {paragraphs?.map((para, index) => (
                <MotionWrapper
                  key={index}
                  animation="fadeInRight"
                  delay={0.5 + index * 0.2}
                  duration={1.2}
                >
                  <p className="text-neutral-500 dark:text-neutral-400 text-base md:text-lg lg:text-lg leading-[1.8] font-medium max-w-xl mx-auto lg:mx-0">
                    {para}
                  </p>
                </MotionWrapper>
              ))}
            </div>
          </MotionContainer>
        </div>
      </div>

      {/* Dinosaur Mascot (Far Right) */}
      <MotionWrapper
        animation="fadeInRight"
        delay={1.2}
        duration={2.0}
        className="absolute bottom-10 right-0 hidden md:block md:w-40 lg:w-50 z-10 pointer-events-none opacity-100"
      >
        <Image
          src="/vision_mission.png"
          alt="Dinosaur Mascot"
          width={400}
          height={400}
          className="w-full h-auto"
        />
      </MotionWrapper>
    </section>
  )
}
