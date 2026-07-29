'use client'

import { Brain, GraduationCap, School } from 'lucide-react'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'

import { MotionWrapper } from '@/lib/animations/MotionWrapper'
import { hoverLift } from '@/lib/animations/variants'

interface VisionCardProps {
  icon: React.ReactNode
  title: string
  description: string
  iconBg: string
  index?: number
}

const VisionCard = ({ icon, title, description, iconBg, index = 0 }: VisionCardProps) => (
  <MotionWrapper
    animation="fadeInUp"
    delay={index * 0.3}
    duration={1.2}
    whileHover={hoverLift}
    className="flex flex-col items-center group max-md:w-full w-[260px] xl:w-[340px]"
  >
    <div className="bg-background rounded-[10px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] p-1.5 flex items-center gap-4 w-full mb-5 border border-queen-pink/20 dark:border-neutral-800 transition-colors duration-300">
      <div
        className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
        style={{ backgroundColor: iconBg }}
      >
        <div className="text-white drop-shadow-sm">{icon}</div>
      </div>
      <h3 className="text-[1.05rem] font-bold text-primary-black dark:text-neutral-100 leading-tight pr-2">
        {title}
      </h3>
    </div>
    <p className="text-neutral-500 dark:text-neutral-400 text-[0.88rem] leading-[1.6] font-medium text-center px-2">
      {description}
    </p>
  </MotionWrapper>
)

export default function VisionMission() {
  const { t } = useTranslation()

  const cardTranslations = t('common.vision_mission.cards', { returnObjects: true }) as {
    title: string
    description: string
  }[]

  const cards = [
    {
      icon: <GraduationCap size={28} strokeWidth={2.5} />,
      title: cardTranslations[0]?.title || 'Clear Academic Structure',
      description:
        cardTranslations[0]?.description ||
        'Well-defined learning paths from Class 6 to 12, designed for clarity, consistency, and confident progress.',
      iconBg: '#73C6BE',
    },
    {
      icon: <School size={28} strokeWidth={2.5} />,
      title: cardTranslations[1]?.title || 'Education Without Boundaries',
      description:
        cardTranslations[1]?.description ||
        'Equal access to quality education, empowering students from villages to cities across Gujarat.',
      iconBg: '#C18F7D',
    },
    {
      icon: <Brain size={28} strokeWidth={2.5} />,
      title: cardTranslations[2]?.title || 'AI-Powered Personal Learning',
      description:
        cardTranslations[2]?.description ||
        "Personalized guidance that adapts to each student's pace, strengths, and learning needs.",
      iconBg: '#B03472',
    },
  ]

  return (
    <section className="relative py-28 bg-lavender-blush dark:bg-background overflow-hidden transition-colors duration-300">
      {/* Scalloped Top Divider */}
      <div className="absolute top-0 left-0 w-full leading-[0] h-6">
        <div className="flex w-full justify-center">
          {[...Array(150)].map((_, i) => (
            <div
              key={i}
              className="w-5 h-5 bg-white-smoke dark:bg-background rounded-full -mt-3 shrink-0"
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 relative z-20">
        {/* Header Content */}
        <MotionWrapper animation="fadeInDown" className="text-center mb-16" duration={1.2}>
          <h2 className="text-primary-hover dark:text-queen-pink font-bold text-lg md:text-xl tracking-wide">
            {t('common.vision_mission.label')}
          </h2>
        </MotionWrapper>

        {/* Desktop Layout */}
        <div className="relative max-w-7xl mx-auto hidden lg:block pb-12">
          <div className="flex items-center justify-center gap-6 xl:gap-10 relative px-4">
            {/* Left Card */}
            <div className="translate-y-[-20px] shrink-0">
              <VisionCard {...cards[0]} index={0} />
            </div>

            {/* Central Semi-Circle Area */}
            <MotionWrapper
              animation="springUp"
              custom={{ stiffness: 60, damping: 25 }}
              delay={0.5}
              className="relative flex items-center justify-center w-[400px] xl:w-[480px] h-[200px] xl:h-[240px] shrink-0"
            >
              {/* Main Semi-Circle */}
              <div className="absolute inset-0 bg-primary rounded-t-full flex items-start justify-center pt-10 xl:pt-14 px-10 xl:px-14 border-b-0">
                <h3 className="text-white text-base xl:text-xl font-bold text-center leading-[1.2] max-w-[220px] xl:max-w-[280px] transition-transform group-hover:scale-105">
                  {t('common.vision_mission.headline')}
                </h3>
              </div>

              {/* Inner Scale-up Semi-Circle for the arrow */}
              <div className="absolute bottom-[-2px] left-1/2 -translate-x-1/2 w-32 h-16 xl:w-40 xl:h-20 bg-lavender-blush dark:bg-background rounded-t-full flex items-center justify-center border-b-0 transition-colors duration-300">
                <div className="mt-2 xl:mt-4 transition-transform hover:scale-110 duration-300">
                  <Image
                    src="/arrow.png"
                    alt="arrow"
                    width={56}
                    height={56}
                    className="w-10 h-10 xl:w-12 xl:h-12 rotate-0"
                    priority
                  />
                </div>
              </div>
            </MotionWrapper>

            {/* Right Card */}
            <div className="translate-y-[-20px] shrink-0">
              <VisionCard {...cards[1]} index={1} />
            </div>
          </div>

          {/* Bottom Center Card */}
          <div className="flex justify-center mt-12 xl:mt-16">
            <VisionCard {...cards[2]} index={2} />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col items-center gap-12">
          {cards.map((card, idx) => (
            <VisionCard key={idx} {...card} index={idx} />
          ))}
        </div>
      </div>

      {/* Scalloped Bottom Divider */}
      <div className="absolute -bottom-3 left-0 w-full leading-[0] h-5 overflow-hidden">
        <div className="flex w-full justify-center">
          {[...Array(150)].map((_, i) => (
            <div
              key={i}
              className="w-5 h-5 bg-white-smoke dark:bg-background rounded-full shrink-0"
            />
          ))}
        </div>
      </div>
    </section>
  )
}
