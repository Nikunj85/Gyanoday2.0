'use client'

import { ChevronDown, Globe, Menu, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/providers/language-provider'
import { useQuizStore } from '@/store/use-quiz-store'
import { useUserStore } from '@/store/user-store'

import { ExitConfirmationDialog } from '../components/ExitConfirmationDialog'

export function Header() {
  const { t, ready } = useTranslation()
  const { language, setLanguage } = useLanguage()
  const { user, isLoading, logout } = useUserStore()
  const router = useRouter()
  const { questions, isReviewMode, isGenerating, reset: resetQuiz } = useQuizStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [showExitDialog, setShowExitDialog] = useState(false)
  const pendingUrlRef = useRef<string | null>(null)
  const pathname = usePathname()

  // Check if a quiz is actively running or generating (on quiz page, not in review mode)
  const isQuizActive =
    pathname === '/quiz' && (questions.length > 0 || isGenerating) && !isReviewMode

  // Intercept navigation when quiz is active
  const handleNavigation = useCallback(
    (e: React.MouseEvent, href: string) => {
      if (isQuizActive) {
        e.preventDefault()
        pendingUrlRef.current = href
        setShowExitDialog(true)
        setIsMobileMenuOpen(false)
        return
      }
      if (pathname?.startsWith('/quiz')) {
        e.preventDefault()
        setIsMobileMenuOpen(false)
        router.replace(href)
      }
    },
    [isQuizActive, pathname, router]
  )

  // Handle confirm exit from quiz
  const confirmExitQuiz = useCallback(() => {
    const url = pendingUrlRef.current
    pendingUrlRef.current = null
    setShowExitDialog(false)
    if (url) {
      router.replace(url)
    }
  }, [router])

  // Handle cancel exit
  const cancelExitQuiz = useCallback(() => {
    setShowExitDialog(false)
    pendingUrlRef.current = null
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  const navLinks = [
    { name: t('common.home'), href: '/' },
    { name: t('common.about_us'), href: '/about' },
    { name: t('common.contact'), href: '/contact' },
    { name: t('common.faq'), href: '/faq' },
  ]

  const getInitials = (name: string) => {
    if (!name) return 'N/A'
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const langAbbr: Record<string, string> = {
    en: 'ENG',
    hi: 'HIN',
    gu: 'GUJ',
  }

  return (
    <>
      <header
        className={`${isMobileMenuOpen ? 'fixed inset-0 bg-background z-[1000]' : 'sticky top-0 z-50 bg-background'} left-0 right-0 w-full transition-all duration-300 ${!isMobileMenuOpen && isScrolled ? 'bg-background/80 backdrop-blur-md shadow-sm py-3' : 'py-2'}`}
      >
        <div
          className={`container mx-auto px-4 flex items-center justify-between ${isMobileMenuOpen ? 'hidden' : 'flex'}`}
        >
          {/* Logo */}
          <div className="flex-1 flex justify-start">
            <Link
              href="/"
              className="shrink-0 transition-transform active:scale-95"
              onClick={(e) => handleNavigation(e, '/')}
            >
              <Image
                src="/gyanoday_Logo.png"
                alt="Gyanoday Logo"
                width={300}
                height={100}
                className="w-auto h-12 md:h-16 object-contain"
                priority
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden xl:flex justify-center items-center space-x-6 2xl:space-x-10 px-4">
            {navLinks.map((link, index) => {
              const isActive = pathname === link.href
              return (
                <div key={index} className="flex flex-col items-center">
                  {!ready ? (
                    <div className="h-5 w-16 bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md" />
                  ) : isActive ? (
                    <div className="flex flex-col items-center cursor-default group">
                      <span className="text-md font-bold text-philosophy">{link.name}</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-philosophy mt-1 animate-pulse" />
                    </div>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={(e) => handleNavigation(e, link.href)}
                      className="flex flex-col items-center group transition-colors text-primary-black hover:text-philosophy"
                    >
                      <span className="text-md font-bold transition-all group-hover:scale-105">
                        {link.name}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-philosophy mt-1 transition-all duration-300 opacity-0 scale-0 group-hover:opacity-50 group-hover:scale-100" />
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>

          <div className="flex-1 flex justify-end items-center space-x-2">
            <div className="hidden md:flex items-center space-x-3 xl:space-x-4 2xl:space-x-2">
              {isLoading ? (
                <div className="h-10 w-24 animate-pulse bg-neutral-100 rounded-full" />
              ) : user ? (
                <div className="flex items-center space-x-4">
                  {/* My Dashboard Button */}
                  {!ready ? (
                    <div className="h-10 w-32 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                  ) : pathname === '/dashboard' ? (
                    <div className="bg-cadet-blue/20 text-cadet-blue text-sm font-semibold px-4 xl:px-5 2xl:px-5 py-2.5 rounded-full border border-cadet-blue/30 cursor-default whitespace-nowrap flex items-center gap-2 shadow-inner">
                      <div className="w-1.5 h-1.5 rounded-full bg-cadet-blue animate-pulse" />
                      {t('common.my_dashboard')}
                    </div>
                  ) : (
                    <Link
                      href="/dashboard"
                      onClick={(e) => handleNavigation(e, '/dashboard')}
                      className="bg-cadet-blue text-white text-sm font-bold px-4 xl:px-5 2xl:px-6 py-2.5 rounded-full transition-all hover:bg-cadet-blue/80 hover:shadow-lg active:scale-95 whitespace-nowrap"
                    >
                      {t('common.my_dashboard')}
                    </Link>
                  )}

                  {/* My Course Button - Styled as Purple Pill */}
                  {!ready ? (
                    <div className="h-10 w-32 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                  ) : pathname === '/student-dashboard' ? (
                    <div className="bg-primary/10 text-primary text-sm font-semibold px-5 xl:px-6 2xl:px-8 py-2.5 rounded-full border border-primary/30 cursor-default whitespace-nowrap flex items-center gap-2 shadow-inner">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                      {t('common.my_course')}
                    </div>
                  ) : (
                    <Link
                      href="/student-dashboard"
                      onClick={(e) => handleNavigation(e, '/student-dashboard')}
                      className="bg-primary text-white text-sm font-bold px-5 xl:px-6 2xl:px-8 py-2.5 rounded-full transition-all hover:bg-primary/80 hover:shadow-lg active:scale-95 whitespace-nowrap"
                    >
                      {t('common.my_course')}
                    </Link>
                  )}

                  {/* User Avatar with Initials - Links to Profile */}
                  {pathname === '/profile' ? (
                    <div
                      className="w-10 h-10 rounded-full bg-antique-white flex items-center justify-center text-philosophy font-bold text-sm shadow-inner border border-philosophy/20 cursor-default relative group"
                      title={user.name || 'Profile'}
                    >
                      {getInitials(user.name || 'User')}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-philosophy rounded-full border-2 border-background animate-pulse" />
                    </div>
                  ) : (
                    <Link
                      href="/profile"
                      onClick={(e) => handleNavigation(e, '/profile')}
                      className="w-10 h-10 rounded-full bg-antique-white flex items-center justify-center text-philosophy font-bold text-sm shadow-sm transition-transform hover:scale-105 active:scale-95 border border-philosophy/10"
                      title={user.name || 'Profile'}
                    >
                      {getInitials(user.name || 'User')}
                    </Link>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  {!ready ? (
                    <div className="h-10 w-24 animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                  ) : pathname === '/login' ? (
                    <div className="bg-philosophy/10 text-philosophy text-sm font-semibold px-5 xl:px-6 2xl:px-8 py-2.5 rounded-full border border-philosophy/30 cursor-default whitespace-nowrap flex items-center gap-2 shadow-inner">
                      <div className="w-1.5 h-1.5 rounded-full bg-philosophy animate-pulse" />
                      {t('common.sign_in')}
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={(e) => handleNavigation(e, '/login')}
                      className="bg-philosophy text-white text-sm font-bold px-5 xl:px-6 2xl:px-8 py-2.5 rounded-full transition-all hover:bg-philosophy/90 shadow-md active:scale-95 whitespace-nowrap outline-none"
                    >
                      {t('common.sign_in')}
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Language Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center space-x-1.5 text-primary-black font-bold px-4 py-2 rounded-full hover:bg-philosophy/10 transition-all border border-neutral-500 text-sm whitespace-nowrap">
                  <Globe className="w-4 h-4" />
                  <span>{langAbbr[language]}</span>
                  <ChevronDown className="w-4 h-4 opacity-50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                forceMount
                className="w-32 mt-2 p-1 rounded-xl shadow-xl border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 z-[1100]"
              >
                {['en', 'hi', 'gu'].map((lang) => (
                  <DropdownMenuItem
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`cursor-pointer rounded-lg text-sm ${language === lang ? 'bg-philosophy/5 text-philosophy font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
                  >
                    {t(`common.languages.${lang}`)}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Toggle */}
            <button
              className="xl:hidden p-2 rounded-full text-primary-black hover:bg-neutral-100 transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="xl:hidden w-full h-full flex flex-col animate-in fade-in duration-300">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
              <Link
                href="/"
                onClick={(e) => {
                  if (isQuizActive) {
                    handleNavigation(e, '/')
                  } else {
                    setIsMobileMenuOpen(false)
                  }
                }}
              >
                <Image
                  src="/gyanoday_Logo.png"
                  alt="Gyanoday Logo"
                  width={300}
                  height={100}
                  className="w-auto h-12 md:h-16 object-contain"
                />
              </Link>
              <div className="flex items-center space-x-4">
                {/* Language Selector in Mobile Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center justify-center space-x-1.5 text-primary-black dark:text-white font-bold px-4 py-1.5 rounded-full hover:bg-philosophy/10 transition-all border border-neutral-500 text-sm whitespace-nowrap">
                      <Globe className="w-4 h-4" />
                      <span>{langAbbr[language]}</span>
                      <ChevronDown className="w-4 h-4 opacity-50" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    forceMount
                    className="w-32 mt-2 p-1 rounded-xl shadow-xl border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 z-[1100]"
                  >
                    {['en', 'hi', 'gu'].map((lang) => (
                      <DropdownMenuItem
                        key={lang}
                        onClick={() => setLanguage(lang)}
                        className={`cursor-pointer rounded-lg text-sm ${language === lang ? 'bg-philosophy/5 text-philosophy font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
                      >
                        {t(`common.languages.${lang}`)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  className="p-2 rounded-full text-primary-black dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Mobile Menu Content */}
            <div className="flex-grow overflow-y-auto p-6 flex flex-col">
              <nav className="flex flex-col space-y-2 mb-8">
                {navLinks.map((link, index) => (
                  <div key={index}>
                    {!ready ? (
                      <div className="h-14 w-full animate-pulse bg-neutral-100 dark:bg-neutral-800 rounded-2xl mb-2" />
                    ) : pathname === link.href ? (
                      <div className="flex items-center justify-between py-4 px-6 mb-2 bg-philosophy/5 text-philosophy rounded-2xl border border-philosophy/10 shadow-inner cursor-default">
                        <span className="text-lg font-black">{link.name}</span>
                        <div className="w-2 h-2 rounded-full bg-philosophy animate-pulse" />
                      </div>
                    ) : (
                      <Link
                        href={link.href}
                        className="block py-4 px-6 text-lg font-bold text-primary-black dark:text-white rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-all mb-2"
                        onClick={(e) => {
                          if (isQuizActive) {
                            handleNavigation(e, link.href)
                          } else {
                            setIsMobileMenuOpen(false)
                          }
                        }}
                      >
                        {link.name}
                      </Link>
                    )}
                  </div>
                ))}
              </nav>

              <div className="mt-auto pb-10 flex flex-col space-y-4">
                {isLoading || !ready ? (
                  <div className="h-12 w-full animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
                ) : user ? (
                  <>
                    {/* Mobile Dashboard Button */}
                    {pathname === '/dashboard' ? (
                      <div className="w-full py-4 text-center text-lg font-black text-cadet-blue bg-cadet-blue/10 rounded-2xl border border-cadet-blue/20 cursor-default flex items-center justify-center gap-3 shadow-inner">
                        <div className="w-2 h-2 rounded-full bg-cadet-blue animate-pulse" />
                        {t('common.my_dashboard')}
                      </div>
                    ) : (
                      <Link
                        href="/dashboard"
                        className="w-full py-4 text-center text-lg font-bold text-white bg-cadet-blue border-2 border-cadet-blue rounded-2xl shadow-sm"
                        onClick={(e) => {
                          if (isQuizActive) {
                            handleNavigation(e, '/dashboard')
                          } else {
                            setIsMobileMenuOpen(false)
                          }
                        }}
                      >
                        {t('common.my_dashboard')}
                      </Link>
                    )}

                    {pathname === '/student-dashboard' ? (
                      <div className="w-full py-4 text-center text-lg font-black text-primary bg-primary/10 rounded-2xl border border-primary/20 cursor-default flex items-center justify-center gap-3 shadow-inner">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        {t('common.my_course')}
                      </div>
                    ) : (
                      <Link
                        href="/student-dashboard"
                        className="w-full py-4 text-center text-lg font-bold text-white bg-primary rounded-2xl shadow-lg"
                        onClick={(e) => {
                          if (isQuizActive) {
                            handleNavigation(e, '/student-dashboard')
                          } else {
                            setIsMobileMenuOpen(false)
                          }
                        }}
                      >
                        {t('common.my_course')}
                      </Link>
                    )}
                    {pathname === '/profile' ? (
                      <div className="flex items-center justify-between p-4 bg-philosophy/5 dark:bg-neutral-800/50 rounded-2xl border border-philosophy/10 shadow-inner">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-antique-white flex items-center justify-center text-philosophy font-bold relative">
                            {getInitials(user.name || 'User')}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-philosophy rounded-full border-2 border-background animate-pulse" />
                          </div>
                          <div>
                            <span className="block font-bold text-philosophy dark:text-white">
                              {user.name}
                            </span>
                            <span className="text-xs text-philosophy/60 dark:text-neutral-400 font-medium">
                              Currently Viewing Profile
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <Link
                        href="/profile"
                        className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-neutral-800 rounded-2xl transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-700"
                        onClick={(e) => {
                          if (isQuizActive) {
                            handleNavigation(e, '/profile')
                          } else {
                            setIsMobileMenuOpen(false)
                          }
                        }}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-antique-white flex items-center justify-center text-philosophy font-bold">
                            {getInitials(user.name || 'User')}
                          </div>
                          <div>
                            <span className="block font-bold text-primary-black dark:text-white">
                              {user.name}
                            </span>
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                              View Profile
                            </span>
                          </div>
                        </div>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    {!ready ? (
                      <div className="h-14 w-full animate-pulse bg-neutral-200 dark:bg-neutral-800 rounded-2xl" />
                    ) : pathname === '/login' ? (
                      <div className="w-full py-4 text-center text-lg font-black text-philosophy bg-philosophy/10 rounded-2xl border border-philosophy/20 cursor-default flex items-center justify-center gap-3 shadow-inner">
                        <div className="w-2 h-2 rounded-full bg-philosophy animate-pulse" />
                        {t('common.sign_in')}
                      </div>
                    ) : (
                      <Link
                        href="/login"
                        className="w-full py-4 text-center text-lg font-bold text-white bg-philosophy rounded-2xl shadow-lg active:scale-[0.98] transition-transform"
                        onClick={(e) => {
                          if (isQuizActive) {
                            handleNavigation(e, '/login')
                          } else {
                            setIsMobileMenuOpen(false)
                          }
                        }}
                      >
                        {t('common.sign_in')}
                      </Link>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Quiz Exit Confirmation Dialog */}
      <ExitConfirmationDialog
        isOpen={showExitDialog}
        onClose={cancelExitQuiz}
        onConfirm={confirmExitQuiz}
      />
    </>
  )
}
