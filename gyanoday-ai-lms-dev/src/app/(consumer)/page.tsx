'use client'

import Hero from '@/app/(consumer)/components/hero'

import AboutSection from './components/AboutSection'
import VisionMission from './components/VisionMission'
import WhyGyanoday from './components/WhyGyanoday'

export default function Home() {
  return (
    <div className="flex flex-col selection:bg-secondary selection:text-primary">
      <Hero />
      <AboutSection />
      <VisionMission />
      <WhyGyanoday />
    </div>
  )
}
