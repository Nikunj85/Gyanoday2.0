'use client'

import { Construction } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="flex h-[calc(100vh-160px)] flex-col items-center justify-center space-y-4">
      <div className="rounded-full bg-secondary/20 p-6">
        <Construction className="h-12 w-12 text-primary" />
      </div>
      <h1 className="text-2xl font-black text-primary">Admin Settings</h1>
      <p className="text-slate-500 font-medium">This module is currently under development.</p>
    </div>
  )
}
