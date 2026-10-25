'use client'

import '@/lib/i18n'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { normalizeMedium } from '@/lib/class-utils'
import { useUserStore } from '@/store/user-store'

type LanguageContextType = {
  language: string
  setLanguage: (lang: string) => void
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation()
  const user = useUserStore((state) => state.user)
  const [language, setLanguageState] = useState(i18n.language || 'en')

  // 1. Sync: the whole app (every page) follows the student's medium of instruction —
  // Hindi medium → Hindi UI, Gujarati medium → Gujarati UI, English medium → English.
  // Re-runs when the medium changes (e.g. profile edit) as well as on login.
  useEffect(() => {
    if (user?.language) {
      const medium = normalizeMedium(user.language)
      if ((i18n.language || '').split('-')[0] !== medium) i18n.changeLanguage(medium)
    }
  }, [user?.id, user?.language, i18n])

  // 2. State Sync: Keep local state in sync with i18n
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      const safeLng = lng || 'en'
      const primaryLng = safeLng.split('-')[0]
      setLanguageState(primaryLng)
      document.documentElement.lang = primaryLng
    }

    // Set initial state
    handleLanguageChanged(i18n.language)

    i18n.on('languageChanged', handleLanguageChanged)
    return () => i18n.off('languageChanged', handleLanguageChanged)
  }, [i18n])

  const setLanguage = async (lang: string) => {
    await i18n.changeLanguage(lang)
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading: false }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
