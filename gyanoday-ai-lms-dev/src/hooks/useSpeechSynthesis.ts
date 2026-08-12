'use client'

import { useCallback, useEffect, useState } from 'react'

const langMap: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  gu: 'gu-IN',
}

/**
 * Wraps the browser's built-in speechSynthesis (text-to-speech). Free,
 * no external API. Strips basic markdown before reading so the voice
 * doesn't say "asterisk asterisk" etc.
 */
export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false)
  const [speakingId, setSpeakingId] = useState<string | null>(null)

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window)
  }, [])

  const speak = useCallback((id: string, text: string, language: string = 'en') => {
    if (!isSupported) return

    window.speechSynthesis.cancel()

    const plainText = text
      .replace(/[*_#`~]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .trim()

    if (!plainText) return

    const utterance = new SpeechSynthesisUtterance(plainText)
    utterance.lang = langMap[language] || 'en-US'
    utterance.rate = 1
    utterance.onstart = () => setSpeakingId(id)
    utterance.onend = () => setSpeakingId(null)
    utterance.onerror = () => setSpeakingId(null)

    window.speechSynthesis.speak(utterance)
  }, [isSupported])

  const stop = useCallback(() => {
    if (!isSupported) return
    window.speechSynthesis.cancel()
    setSpeakingId(null)
  }, [isSupported])

  return { isSupported, speakingId, speak, stop }
}
