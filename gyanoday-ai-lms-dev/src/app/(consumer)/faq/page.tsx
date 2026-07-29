'use client'

import { ArrowRight, Minus, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { MotionContainer, MotionWrapper } from '@/lib/animations/MotionWrapper'
import { cn } from '@/lib/utils'

import panda from '../../../../public/panda.png'

export default function Faq() {
  const { t } = useTranslation()
  const [openId, setOpenId] = useState<number | null>(1)

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id)
  }

  const faqsData = t('common.faq_page.questions', { returnObjects: true })
  const faqs = Array.isArray(faqsData) ? faqsData : []

  return (
    <main className="relativen py-7 md:py-[12rem] overflow-hidden bg-background transition-colors duration-300">
      {/* Panda Decoration - Top Right */}
      <MotionWrapper
        animation="fadeInRight"
        delay={0.5}
        duration={1.5}
        className="absolute right-0 top-[30] md:top-20 z-0 opacity-100 hidden lg:block pointer-events-none"
      >
        <Image
          src={panda}
          alt="Panda mascot"
          width={300}
          height={300}
          className="w-38 xl:w-54 h-auto"
          priority
        />
      </MotionWrapper>

      <div className="container mx-auto px-6 md:px-13 lg:px-18  relative z-10 justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-10 items-end">
          {/* Left Side: Content */}
          <MotionWrapper animation="fadeInDown" duration={1.2} className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-philosophy dark:text-lavender-mist leading-tight transition-colors duration-300">
                {t('common.faq_page.headline_1')}
                <br />
                {t('common.faq_page.headline_2')}
              </h1>
              <p className="text-neutral-500 dark:text-neutral-400 text-lg md:text-xl font-medium leading-relaxed max-w-lg transition-colors duration-300">
                {t('common.faq_page.subtext')}
              </p>
            </div>
          </MotionWrapper>

          {/* Right Side: Accordion */}
          <MotionContainer staggerChildren={0.1} delayChildren={0.2} className="space-y-6">
            {faqs.map((faq: any, index: number) => {
              const isOpen = openId === index + 1
              return (
                <MotionWrapper
                  key={index}
                  animation="fadeInUp"
                  className="border-b border-neutral-200 dark:border-neutral-800 transition-all duration-300"
                >
                  <button
                    onClick={() => toggleFaq(index + 1)}
                    className="w-full flex items-center justify-between text-left group gap-4 py-2"
                  >
                    <h3
                      className={cn(
                        'text-lg md:text-xl font-bold transition-colors',
                        isOpen
                          ? 'text-philosophy dark:text-lavender-mist'
                          : 'text-philosophy dark:text-lavender-mist/80 group-hover:text-philosophy dark:group-hover:text-lavender-mist'
                      )}
                    >
                      {faq.question}
                    </h3>
                    <div
                      className={cn(
                        'flex-shrink-0 w-6 h-6 flex items-center justify-center transition-colors',
                        isOpen
                          ? 'text-philosophy dark:text-lavender-mist'
                          : 'text-philosophy dark:text-lavender-mist/80 group-hover:text-philosophy dark:group-hover:text-lavender-mist'
                      )}
                    >
                      {isOpen ? (
                        <Minus size={20} strokeWidth={3} />
                      ) : (
                        <Plus size={20} strokeWidth={3} />
                      )}
                    </div>
                  </button>

                  <div
                    className={cn(
                      'grid transition-all duration-300 ease-in-out',
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="pb-6">
                        <p className="text-neutral-500 dark:text-neutral-400 text-base md:text-lg font-medium leading-relaxed pr-8 transition-colors duration-300">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </MotionWrapper>
              )
            })}
          </MotionContainer>
        </div>
      </div>
    </main>
  )
}
