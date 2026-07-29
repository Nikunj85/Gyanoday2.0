'use client'

import { useEffect, useState } from 'react'

interface TimerProps {
  isActive?: boolean
  onTimeUpdate?: (seconds: number) => void
  initialTime?: number
  color?: string
  staticTime?: string
}

export const Timer = ({
  isActive = true,
  onTimeUpdate,
  initialTime = 300,
  color = 'var(--ariana-pink)',
  staticTime,
}: TimerProps) => {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!isActive) return

    const timerId = setInterval(() => {
      setSeconds((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(timerId)
  }, [isActive])

  useEffect(() => {
    onTimeUpdate?.(seconds)
  }, [seconds, onTimeUpdate])

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60

  return (
    <div
      className="px-6 py-2 border-2 bg-white dark:bg-neutral-800 rounded-lg transition-colors duration-300 shadow-sm"
      style={{ borderColor: `${color}33` }} // 20% opacity for border
    >
      <span className="font-bold text-xl tabular-nums " style={{ color: color }}>
        {staticTime && !isActive
          ? staticTime
          : `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`}
      </span>
    </div>
  )
}
