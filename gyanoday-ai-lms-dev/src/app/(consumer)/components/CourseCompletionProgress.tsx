'use client'

import React from 'react'

interface CourseCompletionProgressProps {
  value: number
  label?: string
  strokeWidth?: number
}

export function CourseCompletionProgress({
  value = 0,
  label,
  strokeWidth = 10,
}: CourseCompletionProgressProps) {
  const uniqueId = React.useId().replace(/:/g, '')
  const gradientId = `courseProgressGradient-${uniqueId}`
  // Use a fixed virtual coordinate system (100x100) for internal SVG math
  const viewBoxSize = 100
  const center = viewBoxSize / 2
  const radius = (viewBoxSize - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / 100) * circumference

  return (
    <div className="relative flex flex-col items-center justify-center group w-full h-full min-w-0 min-h-0 @container">
      <div className="relative flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md shadow-[inset_0_2px_10px_rgba(255,255,255,0.1)] border border-white/10 transition-transform duration-300 group-hover:scale-105 w-full h-full aspect-square">
        <svg
          viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
          className="w-full h-full transform -rotate-90 drop-shadow-[0_0_8px_rgba(148,127,194,0.3)]"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--white-smoke)" />
              <stop offset="20%" stopColor="var(--lavender-mist)" />
              <stop offset="50%" stopColor="var(--lavender-blush)" />
              <stop offset="70%" stopColor="var(--ghost-white)" />
              <stop offset="100%" stopColor="var(--primary)" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Circle (Track) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke="rgba(255, 255, 255, 0.15)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Progress Circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: 'drop-shadow(0 0 6px rgba(148, 127, 194, 0.6))',
              strokeDashoffset: offset,
            }}
          />
        </svg>

        {/* Center Content - Truly fluid scaling using Container Query Units (cqw) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
          <span className="font-black text-white leading-none drop-shadow-md text-[20cqw]">
            {Math.round(value)}%
          </span>
          {label && (
            <span className="font-bold uppercase tracking-tighter text-white/70 px-[10%] text-center leading-tight max-w-[90%] text-[8cqw] mt-[2cqw]">
              {label}
            </span>
          )}
        </div>
      </div>

      {/* Subtle bottom shadow to make it pop */}
      <div className="absolute -bottom-2 w-[60%] h-2 bg-black/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </div>
  )
}
