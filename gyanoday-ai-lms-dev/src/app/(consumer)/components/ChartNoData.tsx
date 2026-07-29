'use client'

import React from 'react'

import { MotionWrapper } from '@/lib/animations/MotionWrapper'

interface ChartNoDataProps {
  title: string
  message: string
  icon: React.ElementType
  colorVariant?: 'primary' | 'philosophy'
}

const colorMaps = {
  primary: {
    shadow: 'shadow-primary/10',
    text: 'text-primary',
    bgDim: 'bg-primary/20',
    bgSolid: 'bg-primary',
  },
  philosophy: {
    shadow: 'shadow-philosophy/10',
    text: 'text-philosophy',
    bgDim: 'bg-philosophy/20',
    bgSolid: 'bg-philosophy',
  },
}

export const ChartNoData = ({
  title,
  message,
  icon: Icon,
  colorVariant = 'primary',
}: ChartNoDataProps) => {
  const colors = colorMaps[colorVariant]

  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/40 dark:bg-neutral-900/40 backdrop-blur-[4px] transition-all duration-700 animate-in fade-in">
      <MotionWrapper animation="fadeInUp" delay={0.1}>
        <div className="flex flex-col items-center text-center px-6">
          <div
            className={`w-20 h-20 rounded-[28px] bg-white dark:bg-neutral-800 shadow-xl ${colors.shadow} flex items-center justify-center mb-6 transform transition-transform hover:scale-110 duration-500`}
          >
            <Icon className={`w-10 h-10 animate-pulse ${colors.text}`} />
          </div>
          <h4 className="text-xl md:text-2xl font-black text-neutral-800 dark:text-white mb-2 tracking-tight">
            {title}
          </h4>
          <p className="text-sm font-bold text-neutral-400 dark:text-neutral-500 max-w-[320px] leading-relaxed">
            {message}
          </p>
          <div className="mt-8 flex gap-3">
            <div className={`h-1.5 w-8 rounded-full ${colors.bgDim}`} />
            <div className={`h-1.5 w-12 rounded-full ${colors.bgSolid}`} />
            <div className={`h-1.5 w-8 rounded-full ${colors.bgDim}`} />
          </div>
        </div>
      </MotionWrapper>
    </div>
  )
}
