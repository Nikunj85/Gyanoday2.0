'use client'

import '@/lib/i18n'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

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

  // 1. Initial Sync: Only when user logs in
  useEffect(() => {
    // When a user logs in, set the translation language to their medium language.
    if (user?.language) {
      i18n.changeLanguage(user.language)
    }
  }, [user?.id]) // ONLY trigger when the user ID changes (login/logout)

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
    // Note: We intentionally DO NOT sync this back to the user's profile database.
    // The translation language (UI) is now decoupled from the medium language (Content).
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
