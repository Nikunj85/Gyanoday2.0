'use client'

import {
  BookOpen,
  Layers,
  LayoutDashboard,
  Library,
  ListOrdered,
  LogOut,
  MessageCircle,
  Settings,
  Users,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'

import { cn } from '@/lib/utils'
import { useAdminStore } from '@/store/admin-store'

import Loader from './Loader'

interface SidebarProps {
  isOpen: boolean
  // eslint-disable-next-line no-unused-vars
  setIsOpen: (isOpen: boolean) => void
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { logout, isLoading } = useAdminStore()

  const handleLogout = async () => {
    logout()
    router.push('/mycp/login')
  }

  const menuItems = [
    { id: 'overview', icon: LayoutDashboard, label: 'Overview', href: '/mycp' },
    { id: 'classes', icon: Layers, label: 'Classes', href: '/mycp/classes' },
    { id: 'subjects', icon: Library, label: 'Subjects', href: '/mycp/subjects' },
    { id: 'chapters', icon: ListOrdered, label: 'Chapters', href: '/mycp/chapters' },
    { id: 'students', icon: Users, label: 'Students', href: '/mycp/students' },
    { id: 'contacts', icon: MessageCircle, label: 'Contacts', href: '/mycp/contacts' },
  ]

  return (
    <>
      {/* Sidebar - Desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r px-4 border-slate-100 bg-primary/4 lg:block">
        <div className="flex h-20 items-center gap-3 px-2">
          {/* Logo */}
          <div className="flex items-center transition-transform duration-200 hover:scale-105">
            <Image
              src="/gyanoday_Logo.png"
              alt="Gyanoday Logo"
              width={100}
              height={40}
              className="h-auto w-auto object-contain"
              priority
            />
          </div>
        </div>

        <nav className="mt-4 space-y-1.5 ">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={cn(
                'admin-sidebar-item w-full',
                pathname === item.href ? 'admin-sidebar-item-active' : 'admin-sidebar-item-inactive'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-50 ">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 bg-primary/5 text-primary text-sm font-bold transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95"
          >
            {isLoading ? (
              <Loader size="h-5 w-5" />
            ) : (
              <>
                <LogOut className="h-5 w-5" />
                Sign Out
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 h-full w-72 rounded-lg bg-white transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-20 items-center justify-between px-6">
          <Image
            src="/gyanoday_Logo.png"
            alt="Gyanoday Logo"
            width={140}
            height={40}
            className="h-auto w-auto object-contain"
          />
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-4 space-y-1.5 px-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                router.push(item.href)
                setIsOpen(false)
              }}
              className={cn(
                'admin-sidebar-item w-full',
                pathname === item.href ? 'admin-sidebar-item-active' : 'admin-sidebar-item-inactive'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="font-semibold">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 w-full p-4 border-t border-slate-50 bg-white">
          <button
            onClick={handleLogout}
            disabled={isLoading}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-400 transition-all hover:bg-rose-50 hover:text-rose-600 active:scale-95"
          >
            {isLoading ? (
              <Loader size="h-5 w-5" />
            ) : (
              <>
                <LogOut className="h-5 w-5" />
                Sign Out
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
