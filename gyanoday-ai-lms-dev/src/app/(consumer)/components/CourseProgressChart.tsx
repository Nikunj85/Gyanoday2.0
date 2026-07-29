'use client'

import { BarChart2 } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { MotionWrapper } from '@/lib/animations/MotionWrapper'

import { ChartNoData } from './ChartNoData'
import { ChartSkeleton } from './ChartSkeleton'

interface CourseProgressChartProps {
  isNoData?: boolean
  data?: { name: string; total: number; completed: number }[]
  isLoading?: boolean
}

export function CourseProgressChart({
  isNoData = false,
  data = [],
  isLoading = false,
}: CourseProgressChartProps) {
  const { t } = useTranslation()
  const [activeSeries, setActiveSeries] = useState({
    total: true,
    completed: true,
  })

  const toggleSeries = (key: 'total' | 'completed') => {
    setActiveSeries((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <MotionWrapper animation="fadeInLeft" delay={0.2}>
      <div
        className="bg-white dark:bg-neutral-900 p-4 md:p-12 rounded-[16px] border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all h-[320px] md:h-[500px] relative overflow-hidden"
        style={{
          boxShadow: 'inset 6px 7px 0px 0px var(--neutral-300)',
        }}
      >
        {isLoading ? (
          <ChartSkeleton type="bar" />
        ) : isNoData ? (
          <ChartNoData
            title={t('common.student_dashboard.progress_charts.no_data_subject_title')}
            message={t('common.student_dashboard.progress_charts.no_data_subject_message')}
            icon={BarChart2}
            colorVariant="primary"
          />
        ) : null}
        <div
          className={`flex items-center justify-between mb-6 ${isNoData ? 'opacity-20 grayscale-[50%]' : ''}`}
        >
          <h3 className="text-lg font-bold text-neutral-800 dark:text-lavender-mist">
            {t('common.student_dashboard.progress_charts.course_progress')}
          </h3>
          <div className="flex gap-4">
            <button
              onClick={() => toggleSeries('total')}
              className={`flex items-center gap-2 transition-opacity hover:opacity-80 outline-none ${!activeSeries.total ? 'opacity-40' : ''}`}
            >
              <div className="w-3 h-3 rounded-sm bg-[var(--primary)]" />
              <span
                className={`text-[10px] md:text-xs text-neutral-500 font-medium ${!activeSeries.total ? 'line-through' : ''}`}
              >
                {t('common.student_dashboard.progress_charts.total_chapters')}
              </span>
            </button>
            <button
              onClick={() => toggleSeries('completed')}
              className={`flex items-center gap-2 transition-opacity hover:opacity-80 outline-none ${!activeSeries.completed ? 'opacity-40' : ''}`}
            >
              <div className="w-3 h-3 rounded-sm bg-[var(--lavender-mist)]" />
              <span
                className={`text-[10px] md:text-xs text-neutral-500 font-medium ${!activeSeries.completed ? 'line-through' : ''}`}
              >
                {t('common.student_dashboard.progress_charts.completed_chapters')}
              </span>
            </button>
          </div>
        </div>

        <ResponsiveContainer
          width="100%"
          height="100%"
          className={isNoData ? 'opacity-10 grayscale-[100%]' : ''}
        >
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 50 }} barGap={0}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'black', fontSize: 12, fontWeight: 600 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'black', fontSize: 12, fontWeight: 600 }}
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
            />

            <Tooltip
              cursor={{ fill: '#f8fafc', radius: 8 }}
              contentStyle={{
                borderRadius: '16px',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                padding: '12px',
              }}
              itemStyle={{ color: 'black' }}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      style={{
                        borderRadius: '16px',
                        padding: '12px',
                        backgroundColor: 'var(--neutral-50)',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      }}
                    >
                      {/* Subject name styled separately */}
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 'bold',
                          color: 'var(--primary)', // <-- subject color (use your palette here)
                        }}
                      >
                        {label}
                      </p>
                      {/* Keep completed/total as they are */}
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
            <Bar
              hide={!activeSeries.total}
              dataKey="total"
              fill="var(--primary)"
              radius={[10, 10, 0, 0]}
              barSize={38.42}
            />
            <Bar
              hide={!activeSeries.completed}
              dataKey="completed"
              fill="var(--lavender-mist)"
              radius={[10, 10, 0, 0]}
              barSize={30.93}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </MotionWrapper>
  )
}
