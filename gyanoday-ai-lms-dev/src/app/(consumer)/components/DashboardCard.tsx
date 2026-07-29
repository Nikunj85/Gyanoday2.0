'use client'

import { ArrowRight, BookOpen, CheckCircle2 } from 'lucide-react'
import React from 'react'

interface DashboardCardProps {
  title: string
  footerText: string
  bgColor: string
  shadowClass?: string
  type: 'score' | 'progress' | 'cta'
  score?: {
    current: number
    total: number
  }
  progress?: {
    value: number
    label: string
  }
  cta?: {
    icon?: React.ReactNode
    linkText: string
  }
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  footerText,
  bgColor,
  shadowClass = 'shadow-lg',
  type,
  score,
  progress,
  cta,
}) => {
  return (
    <div
      className={`relative flex flex-col items-center justify-between p-8 rounded-[40px] transition-all duration-300 hover:scale-[1.02] h-[320px] w-full text-white ${shadowClass}`}
      style={{ backgroundColor: bgColor }}
    >
      {/* Top Header Section */}
      <div className="text-center w-full">
        <h3 className="text-xl lg:text-2xl font-bold tracking-tight">
          {type === 'cta' ? (
            <span className="flex items-center justify-center gap-2">
              {title} <ArrowRight className="w-6 h-6" />
            </span>
          ) : (
            title
          )}
        </h3>
      </div>

      {/* Middle Main Section */}
      <div className="flex flex-col items-center justify-center flex-grow w-full py-4">
        {type === 'score' && score && (
          <div className="relative flex items-center justify-center">
            {/* SVG Circle */}
            <svg className="w-32 h-32 -rotate-90">
              <defs>
                {/* Gradient for active arc */}
                <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F5C7E8" />
                  <stop offset="100%" stopColor="#6A1B9A" />
                </linearGradient>
              </defs>

              {/* Background ring */}
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="22"
                fill="transparent"
              />

              {/* Progress ring */}
              <circle
                cx="64"
                cy="64"
                r="54"
                stroke="url(#scoreGradient)"
                strokeWidth="22"
                fill="transparent"
                strokeDasharray={339.292}
                strokeDashoffset={339.292 - (339.292 * score.current) / score.total}
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Center white circle */}
            <div
              className="absolute w-24 h-24 shadow-inner shadow-xl bg-white
rounded-full flex items-center justify-center"
            >
              <span className="text-xl font-bold text-purple-700">
                {score.current}/{score.total}
              </span>
            </div>
          </div>
        )}

        {type === 'progress' && progress && (
          <div className="w-full px-4 space-y-4">
            <div className="relative w-full h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full bg-white transition-all duration-1000 ease-out rounded-full"
                style={{ width: `${progress.value}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="bg-white/20 p-1 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
        )}

        {type === 'cta' && (
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Section */}
      <div className="text-center w-full mt-auto">
        <p className="text-lg font-medium opacity-95">{footerText}</p>
      </div>
    </div>
  )
}
