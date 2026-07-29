'use client'

import { Activity } from 'lucide-react'
import React from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface QuizEngagementChartProps {
  data: { name: string; attempts: number; completions: number }[]
  interval: 'week' | 'month'
  isLoading?: boolean
}

export default function QuizEngagementChart({
  data,
  interval,
  isLoading = false,
}: QuizEngagementChartProps) {
  const hasData = data.some((d) => d.attempts > 0 || d.completions > 0)

  if (isLoading) {
    return (
      <div className="admin-card overflow-hidden animate-pulse">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-5 w-40 bg-slate-200 rounded-lg" />
            <div className="h-3 w-56 bg-slate-100 rounded mt-2" />
          </div>
        </div>
        <div className="h-[350px] w-full flex flex-col justify-center gap-6 px-4">
          <div className="h-3 bg-slate-100 rounded-full w-full" />
          <div className="h-3 bg-slate-100 rounded-full w-11/12" />
          <div className="h-3 bg-slate-100 rounded-full w-4/5" />
          <div className="h-3 bg-slate-100 rounded-full w-full" />
          <div className="h-3 bg-slate-100 rounded-full w-3/4" />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-card overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black text-primary/80">Student Engagement</h3>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
            Quiz Attempts vs completions ({interval === 'week' ? 'Last 7 Days' : 'Last 6 Months'})
          </p>
        </div>
      </div>

      <div className="h-[350px] w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 700 }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px 16px',
                }}
                labelStyle={{ fontWeight: 800, marginBottom: '4px', color: '#1e293b' }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '20px', fontWeight: 700, fontSize: '12px' }}
              />
              <Line
                type="monotone"
                dataKey="attempts"
                name="Quiz Attempts"
                stroke="#4f46e5"
                strokeWidth={4}
                dot={{ r: 4, fill: '#4f46e5', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="completions"
                name="Completions"
                stroke="#10b981"
                strokeWidth={4}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
              <Activity className="h-10 w-10 text-slate-200" />
            </div>
            <p className="text-sm font-black text-slate-300 mb-1">No Engagement Yet</p>
            <p className="text-xs font-medium text-slate-300 text-center max-w-[220px]">
              Quiz attempts and chapter completions will be tracked here once students start
              learning.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
