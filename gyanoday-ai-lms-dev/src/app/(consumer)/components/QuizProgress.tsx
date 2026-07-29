'use client'

import { TrendingUp } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { MotionWrapper } from '@/lib/animations/MotionWrapper'

import { ChartNoData } from './ChartNoData'
import { ChartSkeleton } from './ChartSkeleton'

interface QuizProgressProps {
  isNoData?: boolean
  data?: { name: string; current: number; last: number }[]
  isLoading?: boolean
}

export function QuizProgress({
  isNoData = false,
  data = [],
  isLoading = false,
}: QuizProgressProps) {
  const { t } = useTranslation()
  const [activeSeries, setActiveSeries] = useState({
    last: true,
    current: true,
  })

  const toggleSeries = (key: 'last' | 'current') => {
    setActiveSeries((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <MotionWrapper animation="fadeInRight" delay={0.2}>
      <div
        className="bg-white dark:bg-neutral-900 p-4 md:p-12 rounded-[16px] border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all h-[320px] md:h-[500px] relative overflow-hidden"
        style={{
          boxShadow: 'inset 6px 7px 0px 0px var(--neutral-300)',
        }}
      >
        {isLoading ? (
          <ChartSkeleton type="area" />
        ) : isNoData ? (
          <ChartNoData
            title={t('common.student_dashboard.progress_charts.no_data_progress_title')}
            message={t('common.student_dashboard.progress_charts.no_data_progress_message')}
            icon={TrendingUp}
            colorVariant="philosophy"
          />
        ) : null}
        <div
          className={`flex items-center justify-between mb-6 ${isNoData ? 'opacity-20 grayscale-[50%]' : ''}`}
        >
          <h3 className="text-lg font-bold text-neutral-800 dark:text-lavender-mist">
            {t('common.student_dashboard.progress_charts.quiz_progress')}
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => toggleSeries('last')}
              className={`flex items-center gap-2 transition-opacity hover:opacity-80 outline-none ${!activeSeries.last ? 'opacity-40' : ''}`}
            >
              <div className="w-3 h-3 rounded-full bg-[var(--lavender-mist)]" />
              <span
                className={`text-[10px] md:text-xs text-neutral-500 font-medium ${!activeSeries.last ? 'line-through' : ''}`}
              >
                {t('common.student_dashboard.progress_charts.last_week_quiz_progress')}
              </span>
            </button>
            <button
              onClick={() => toggleSeries('current')}
              className={`flex items-center gap-2 transition-opacity hover:opacity-80 outline-none ${!activeSeries.current ? 'opacity-40' : ''}`}
            >
              <div className="w-3 h-3 rounded-full bg-[var(--philosophy)]" />
              <span
                className={`text-[10px] md:text-xs text-neutral-500 font-medium ${!activeSeries.current ? 'line-through' : ''}`}
              >
                {t('common.student_dashboard.progress_charts.current_week_quiz_progress')}
              </span>
            </button>
          </div>
        </div>

        <ResponsiveContainer
          width="100%"
          height="100%"
          className={isNoData ? 'opacity-10 grayscale-[100%]' : ''}
        >
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 50 }}>
            <defs>
              <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.1} />
                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'black', fontSize: 12, fontWeight: 600 }}
              dy={20}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'black', fontSize: 12, fontWeight: 600 }}
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)',
                padding: '12px',
              }}
              itemStyle={{
                color: 'black',
                fontWeight: 'bold', // makes subject name bold
              }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      style={{
                        borderRadius: '16px',
                        padding: '12px',
                        backgroundColor: 'var(--neutral-50)',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.2)',
                      }}
                    >
                      {/* Subject name styled separately */}
                      <p style={{ margin: 0, fontWeight: 'bold', color: 'var(--philosophy)' }}>
                        {label}
                      </p>
                      {/* Values (completed/total) stay black */}
                      {payload.map((entry, index) => (
                        <p key={`item-${index}`} style={{ margin: 0, color: 'black' }}>
                          {entry.name}: {entry.value}
                        </p>
                      ))}
                    </div>
                  )
                }
                return null
              }}
            />
            <Area
              hide={!activeSeries.last}
              type="monotone"
              dataKey="last"
              stroke="var(--lavender-mist)"
              fill="transparent"
              strokeWidth={2}
              dot={false}
            />
            <Area
              hide={!activeSeries.current}
              type="monotone"
              dataKey="current"
              stroke="var(--philosophy)"
              fillOpacity={1}
              fill="transparent"
              strokeWidth={3}
              dot={{ r: 4, fill: 'var(--philosophy)', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </MotionWrapper>
  )
}
