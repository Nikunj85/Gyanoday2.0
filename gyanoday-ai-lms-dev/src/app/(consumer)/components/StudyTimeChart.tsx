'use client'

import { Clock } from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import {
  StudyDay,
  StudyWeek,
} from '@/app/actions/student-progress-actions'

interface StudyTimeChartProps {
  data: StudyDay[]
  monthlyData: StudyWeek[]
}

type View = 'weekly' | 'monthly'

function formatHours(minutes: number) {
  const value = Math.round(minutes)
  if (value < 60) return `${value}m`
  const h = Math.floor(value / 60)
  const m = value % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

/** Axis label: 45 -> "45m", 60 -> "1h", 90 -> "1h 30m". */
function formatAxisTick(minutes: number) {
  const value = Math.round(minutes)
  if (value <= 0) return '0'
  if (value < 60) return `${value}m`
  const h = Math.floor(value / 60)
  const m = value % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// Clean step sizes, in minutes, for the y-axis.
const AXIS_STEPS = [1, 2, 5, 10, 15, 20, 30, 60, 120, 180, 240, 360, 480, 720]

/**
 * Picks a y-axis that fits the data: whole-minute ticks for short sessions, hour ticks for
 * long ones, never more than ~4 intervals. The old axis rounded minutes to whole hours,
 * so any day under 30 minutes produced a column of "0h" labels.
 */
function buildYAxis(maxMinutes: number) {
  if (!Number.isFinite(maxMinutes) || maxMinutes <= 0) {
    return { ticks: [0, 10, 20, 30], top: 30 }
  }
  const step = AXIS_STEPS.find((s) => Math.ceil(maxMinutes / s) <= 4) ?? 720
  const top = Math.max(1, Math.ceil(maxMinutes / step)) * step
  const ticks: number[] = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  return { ticks, top }
}

export function StudyTimeChart({
  data,
  monthlyData,
}: StudyTimeChartProps) {
  const [view, setView] = useState<View>('weekly')

  const isWeekly = view === 'weekly'

  const totalMinutes = isWeekly
    ? data.reduce(
        (sum: number, item: StudyDay) => sum + item.minutes,
        0
      )
    : monthlyData.reduce(
        (sum: number, item: StudyWeek) => sum + item.minutes,
        0
      )

  const title = isWeekly ? 'This Week' : 'This Month'

  const maxMinutes = Math.max(
    0,
    ...(isWeekly ? data.map((d: StudyDay) => d.minutes) : monthlyData.map((d: StudyWeek) => d.minutes))
  )
  const yAxis = buildYAxis(maxMinutes)

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 rounded-3xl p-5 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-5">
        <div className="flex items-center gap-2">
          <Clock
            size={17}
            className="text-violet-500"
          />

          <div>
            <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-100">
              Study Time
            </h4>

            <p className="text-[11px] text-neutral-400 mt-0.5">
              Tracked learning time from your quiz activity
            </p>
          </div>
        </div>

        {/* Total + Toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-neutral-400">
            {title}:{' '}
            <strong className="text-neutral-700 dark:text-neutral-200">
              {formatHours(totalMinutes)}
            </strong>
          </span>

          <div className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1">
            {(['weekly', 'monthly'] as View[]).map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setView(option)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition ${
                    view === option
                      ? 'bg-white dark:bg-neutral-700 text-neutral-800 dark:text-white shadow-sm'
                      : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                  }`}
                >
                  {option === 'weekly'
                    ? 'Weekly'
                    : 'Monthly'}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 w-full">
        <ResponsiveContainer
          width="100%"
          height="100%"
        >
          {isWeekly ? (
            <BarChart
              data={data}
              margin={{
                top: 8,
                right: 4,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                className="text-neutral-100 dark:text-neutral-800"
              />

              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                width={52}
                domain={[0, yAxis.top]}
                ticks={yAxis.ticks}
                allowDecimals={false}
                tickFormatter={(value) => formatAxisTick(Number(value))}
              />

              <Tooltip
                cursor={{
                  fill: 'rgba(124, 111, 224, 0.06)',
                }}
                formatter={(value) => [
                  formatHours(Number(value ?? 0)),
                  'Study time',
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  fontSize: 12,
                }}
              />

              <Bar
                dataKey="minutes"
                fill="#7C6FE0"
                radius={[6, 6, 2, 2]}
                maxBarSize={42}
              />
            </BarChart>
          ) : (
            <BarChart
              data={monthlyData}
              margin={{
                top: 8,
                right: 4,
                left: 0,
                bottom: 0,
              }}
            >
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                className="text-neutral-100 dark:text-neutral-800"
              />

              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11 }}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 10 }}
                width={52}
                domain={[0, yAxis.top]}
                ticks={yAxis.ticks}
                allowDecimals={false}
                tickFormatter={(value) => formatAxisTick(Number(value))}
              />

              <Tooltip
                cursor={{
                  fill: 'rgba(124, 111, 224, 0.06)',
                }}
                formatter={(value) => [
                  formatHours(Number(value ?? 0)),
                  'Study time',
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  fontSize: 12,
                }}
              />

              <Bar
                dataKey="minutes"
                fill="#7C6FE0"
                radius={[6, 6, 2, 2]}
                maxBarSize={58}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between text-[10px] text-neutral-400">
        <span>
          {isWeekly
            ? 'Monday → Sunday'
            : 'Current calendar month'}
        </span>

        <span>
          Axis scales to your time • tap bars for exact time
        </span>
      </div>
    </div>
  )
}