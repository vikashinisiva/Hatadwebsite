'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import en from './en.json'
import ta from './ta.json'

export type Locale = 'en' | 'ta'

const translations: Record<Locale, Record<string, string>> = { en, ta }

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, replacements?: Record<string, string>) => string
}

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    const saved = localStorage.getItem('hatad_lang') as Locale | null
    if (saved && (saved === 'en' || saved === 'ta')) {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('hatad_lang', l)
  }, [])

  const t = useCallback((key: string, replacements?: Record<string, string>): string => {
    let str = translations[locale]?.[key] || translations.en[key] || key
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        str = str.replace(`{${k}}`, v)
      }
    }
    return str
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  return useContext(I18nContext)
}

export function useT() {
  return useContext(I18nContext).t
}
