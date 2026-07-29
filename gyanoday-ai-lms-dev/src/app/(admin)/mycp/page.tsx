'use client'

import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  Settings,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import QuizEngagementChart from '@/components/admin/QuizEngagementChart'
import StatCard from '@/components/admin/StatCard'
import UpcomingEvents from '@/components/admin/UpcomingEvents'
import UserGrowthChart from '@/components/admin/UserGrowthChart'
import { dashboardService } from '@/services/dashboard-service'
import { useAdminStore } from '@/store/admin-store'

export default function AdminDashboard() {
  const { user, isLoading: isAdminLoading } = useAdminStore()
  const [chartInterval, setChartInterval] = useState<'week' | 'month'>('week')

  const { data: dashboardStats, isLoading: isStatsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => dashboardService.getDashboardStats(),
    enabled: !!user,
  })

  const { data: growthStats, isLoading: isGrowthLoading } = useQuery({
    queryKey: ['admin-growth-stats', chartInterval],
    queryFn: () => dashboardService.getUserGrowthStats(chartInterval),
    enabled: !!user,
  })

  const { data: engagementStats, isLoading: isEngagementLoading } = useQuery({
    queryKey: ['admin-engagement-stats', chartInterval],
    queryFn: () => dashboardService.getEngagementStats(chartInterval),
    enabled: !!user,
  })

  if (isAdminLoading || isStatsLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] items-center justify-center bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const stats = [
    {
      label: 'Total Students',
      value: dashboardStats?.userCount.toLocaleString() || '0',
      change: '',
      trend: 'up' as const,
      icon: Users,
      href: '/mycp/students',
    },
    {
      label: 'Total Classes',
      value: dashboardStats?.classCount.toLocaleString() || '0',
      change: '',
      trend: 'up' as const,
      icon: GraduationCap,
      href: '/mycp/classes',
    },
    {
      label: 'Total Subjects',
      value: dashboardStats?.subjectCount.toLocaleString() || '0',
      change: '',
      trend: 'up' as const,
      icon: BookOpen,
      href: '/mycp/subjects',
    },
    {
      label: 'Total Chapters',
      value: dashboardStats?.chapterCount.toLocaleString() || '0',
      change: '',
      trend: 'up' as const,
      icon: LayoutDashboard,
      href: '/mycp/chapters',
    },
    {
      label: 'Quiz Attempts',
      value: dashboardStats?.attemptCount.toLocaleString() || '0',
      change: '',
      trend: 'up' as const,
      icon: ClipboardList,
    },
  ]

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-3xl font-black text-primary">Overview</h2>
          <p className="font-medium text-slate-500 mt-1">Gyanoday AI Learning Management System</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        {stats?.map((stat, i) =>
          stat.href ? (
            <Link key={i} href={stat.href} className="block no-underline">
              <StatCard {...stat} />
            </Link>
          ) : (
            <StatCard key={i} {...stat} />
          )
        )}
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black  text-primary">Platform Analytics</h2>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setChartInterval('week')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                chartInterval === 'week'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              WEEKLY
            </button>
            <button
              onClick={() => setChartInterval('month')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                chartInterval === 'month'
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              MONTHLY
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <UserGrowthChart
              data={growthStats?.chartData || []}
              growthPercentage={growthStats?.growthPercentage || 0}
              interval={chartInterval}
              isLoading={isGrowthLoading}
            />
          </div>
          <div>
            <QuizEngagementChart
              data={engagementStats || []}
              interval={chartInterval}
              isLoading={isEngagementLoading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
