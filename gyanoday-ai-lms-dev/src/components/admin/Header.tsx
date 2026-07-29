'use client'

import { Bell, Menu, Search } from 'lucide-react'

import { useAdminStore } from '@/store/admin-store'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAdminStore()

  if (!user) return null

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-50 bg-primary/4 px-4 backdrop-blur-md md:px-8">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="h-10 w-[1px] bg-slate-100" />
        <div className="flex items-center gap-3 pl-2">
          <div className="hidden text-right md:block">
            <p className="text-base font-bold text-primary leading-none">{user.name}</p>
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-500">
              {user.role}
            </p>
          </div>
          <div className="h-11 w-11 cursor-pointer overflow-hidden rounded-full bg-secondary p-0.5 shadow-sm transition-transform hover:rotate-3 active:scale-95">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-lg font-black text-white">
              {user.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
