'use client'

import React from 'react'

import { DashboardCard } from './DashboardCard'

export default function DashboardSection() {
  const cards = [
    {
      title: 'Overall Student Score',
      footerText: 'Excellent Performance',
      bgColor: '#C9A227',
      shadowClass: 'shadow-[6px_8px_19.4px_0px_rgba(128,122,102,0.49)]',
      type: 'score' as const,
      score: { current: 7, total: 10 },
    },
    {
      title: '12 Tests Completed',
      footerText: 'Keep Going!',
      bgColor: '#0FB9B1',
      type: 'progress' as const,
      progress: { value: 60, label: 'Progress' },
    },
    {
      title: 'Dashboard',
      footerText: 'View Course',
      bgColor: '#E87438',
      type: 'cta' as const,
      cta: { linkText: 'View' },
    },
  ]

  return (
    <section className="py-12 md:py-16 bg-white dark:bg-neutral-900 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10 lg:gap-14 max-w-7xl mx-auto">
          {cards.map((card, index) => (
            <div
              key={index}
              className={
                index === 2 ? 'md:col-span-2 lg:col-span-1 flex justify-center lg:block' : ''
              }
            >
              <div className="w-full max-w-md lg:max-w-none">
                <DashboardCard {...card} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
