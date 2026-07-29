'use client'

import { ArrowRight, Clock, Globe, Hammer } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-white-smoke flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-philosophy/5 rounded-full blur-3xl animate-pulse delay-700" />

      <div className="max-w-2xl w-full text-center z-10">
        {/* Logo/Brand Name */}
        <div className="mb-12 animate-fade-in">
          <h1 className="text-4xl md:text-5xl font-extrabold text-philosophy tracking-tight">
            Gyanoday <span className="text-primary">AI</span>
          </h1>
          <div className="h-1 w-24 bg-gradient-to-r from-philosophy to-primary mx-auto mt-2 rounded-full" />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 chapter-card-shadow border border-white/50 backdrop-blur-sm animate-slide-up">
          <div className="w-20 h-20 bg-lavender-blush rounded-2xl flex items-center justify-center mx-auto mb-8 animate-bounce-slow">
            <Hammer className="w-10 h-10 text-philosophy" />
          </div>

          <h2 className="text-3xl md:text-4xl font-bold text-primary-black mb-4">
            Under Construction
          </h2>

          <p className="text-neutral-600 text-lg mb-8 leading-relaxed">
            We're currently working hard to bring you a better experience. Our digital doors are
            temporarily closed for some scheduled maintenance and exciting new features.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="p-4 bg-ghost-white rounded-xl border border-neutral-100 flex flex-col items-center hover:scale-105 transition-transform">
              <Clock className="w-6 h-6 text-carrot-orange mb-2" />
              <span className="text-sm font-semibold text-neutral-800 uppercase tracking-wider">
                Coming Soon
              </span>
            </div>
            <div className="p-4 bg-ghost-white rounded-xl border border-neutral-100 flex flex-col items-center hover:scale-105 transition-transform">
              <Globe className="w-6 h-6 text-shiny-shamrock mb-2" />
              <span className="text-sm font-semibold text-neutral-800 uppercase tracking-wider">
                Better UI
              </span>
            </div>
            <div className="p-4 bg-ghost-white rounded-xl border border-neutral-100 flex flex-col items-center hover:scale-105 transition-transform">
              <ArrowRight className="w-6 h-6 text-primary mb-2" />
              <span className="text-sm font-semibold text-neutral-800 uppercase tracking-wider">
                AI Powered
              </span>
            </div>
          </div>

          <div className="bg-lavender-mist/30 p-4 rounded-2xl mb-8">
            <p className="text-sm text-neutral-500 italic">
              "Great things take time. We appreciate your patience!"
            </p>
          </div>

          <Link
            href="mailto:support@gyanoday.ai"
            className="inline-flex items-center px-8 py-3 bg-philosophy text-white rounded-full font-bold hover:bg-primary-hover transition-colors shadow-lg shadow-philosophy/20 group"
          >
            Contact Support
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-neutral-400 text-sm animate-fade-in delay-500">
          &copy; {new Date().getFullYear()} Gyanoday AI. All rights reserved.
        </div>
      </div>
    </div>
  )
}
