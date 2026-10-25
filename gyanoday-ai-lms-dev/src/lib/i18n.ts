'use client'

import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import resourcesToBackend from 'i18next-resources-to-backend'
import { initReactI18next } from 'react-i18next'

import { withExtraTranslations } from './i18n-extra'

i18next
  .use(initReactI18next)
  .use(LanguageDetector)
  .use(
    resourcesToBackend(async (language: string, namespace: string) => {
      const mod = await import(`../../public/locales/${language}/${namespace}.json`)
      const data = (mod as any).default ?? mod
      // Merge the Hindi/Gujarati additions on top of the JSON file.
      return namespace === 'common' ? withExtraTranslations(language, data) : data
    })
  )
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'hi', 'gu'],
    ns: ['common'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
    react: {
      useSuspense: false, // Disable suspense to prevent blinking/unmounting
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
    },
  })

export default i18next
