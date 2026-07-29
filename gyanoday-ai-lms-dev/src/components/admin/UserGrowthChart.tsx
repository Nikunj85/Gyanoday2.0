'use client'

import { BarChart3, TrendingDown, TrendingUp } from 'lucide-react'
import React from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

interface UserGrowthChartProps {
  data: { name: string; count: number }[]
  growthPercentage: number
  interval: 'week' | 'month'
  isLoading?: boolean
}

export default function UserGrowthChart({
  data,
  growthPercentage,
  interval,
  isLoading = false,
}: UserGrowthChartProps) {
  const isPositive = growthPercentage >= 0
  const hasData = data.some((d) => d.count > 0)

  if (isLoading) {
    return (
      <div className="admin-card overflow-hidden animate-pulse">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="h-5 w-32 bg-slate-200 rounded-lg" />
            <div className="h-3 w-48 bg-slate-100 rounded mt-2" />
          </div>
          <div className="h-8 w-20 bg-slate-100 rounded-xl" />
        </div>
        <div className="h-[350px] w-full flex items-end gap-3 px-4 pb-8">
          {Array.from({ length: interval === 'week' ? 7 : 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 bg-slate-100 rounded-t-md"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="admin-card overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-lg font-black text-primary/80">Users Growth</h3>
          <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">
            Registration Trends ({interval === 'week' ? 'Last 7 Days' : 'Last 6 Months'})
          </p>
        </div>
        {hasData && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 ${
              isPositive
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600'
                : 'bg-rose-50 border-rose-100 text-rose-600'
            }`}
          >
            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            <span className="text-sm font-black tabular-nums">
              {isPositive ? '+' : ''}
              {growthPercentage}%
            </span>
          </div>
        )}
      </div>

      <div className="h-[350px] w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{
                  borderRadius: '16px',
                  border: 'none',
                  boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                  padding: '12px 16px',
                }}
                labelStyle={{ fontWeight: 800, marginBottom: '4px', color: '#1e293b' }}
                itemStyle={{ fontWeight: 700, color: '#4f46e5' }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={interval === 'week' ? 40 : 60}>
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === data.length - 1 ? '#4f46e5' : '#e2e8f0'}
                    className="transition-all duration-300 hover:opacity-80"
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
              <BarChart3 className="h-10 w-10 text-slate-200" />
            </div>
            <p className="text-sm font-black text-slate-300 mb-1">No Registration Data</p>
            <p className="text-xs font-medium text-slate-300 text-center max-w-[220px]">
              Data will appear here once students begin registering on the platform.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
