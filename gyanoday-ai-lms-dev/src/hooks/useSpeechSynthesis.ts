'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type SpeechLang = 'en' | 'hi' | 'gu'

const LOCALE: Record<SpeechLang, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  gu: 'gu-IN',
}

// Spoken word for a reaction arrow, per language.
const ARROW_WORD: Record<SpeechLang, string> = {
  en: ' gives ',
  hi: ' देता है ',
  gu: ' આપે છે ',
}

/** Turns an AI chat message into clean text for a voice (no markdown, LaTeX, emoji or URLs). */
export function toSpokenText(text: string, language: SpeechLang): string {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    // chemistry / math: \ce{2Mg + O2 -> 2MgO} and $...$ / $$...$$ -> plain readable text
    .replace(/\\ce\{([^}]*)\}/g, '$1')
    .replace(/\$\$?([^$]+)\$\$?/g, '$1')
    .replace(/\\(?:long)?(?:right|to)arrow|-->|->|→|⟶/g, ARROW_WORD[language])
    .replace(/<=>|⇌|⇄/g, language === 'hi' ? ' और वापस ' : language === 'gu' ? ' અને પાછું ' : ' and back ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[{}^_]/g, '')
    // markdown
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[*#`~>|]/g, ' ')
    .replace(/^\s*[-•]\s+/gm, '')
    // emoji & pictographs would be read out as "smiling face with ..."
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Splits long text into sentence-sized pieces; browsers cut off long single utterances. */
function chunkText(text: string, maxLen = 180): string[] {
  const sentences = text.split(/(?<=[.!?।॥:;])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if ((current + ' ' + sentence).trim().length <= maxLen) {
      current = (current + ' ' + sentence).trim()
    } else {
      if (current) chunks.push(current)
      // a single very long sentence: split on commas / spaces
      if (sentence.length > maxLen) {
        const parts = sentence.match(new RegExp(`.{1,${maxLen}}(\\s|$)`, 'g')) || [sentence]
        chunks.push(...parts.map((p) => p.trim()).filter(Boolean))
        current = ''
      } else {
        current = sentence
      }
    }
  }
  if (current) chunks.push(current)
  return chunks
}

function pickVoice(voices: SpeechSynthesisVoice[], language: SpeechLang): SpeechSynthesisVoice | null {
  const locale = LOCALE[language].toLowerCase()
  const prefix = language
  const byLang = voices.filter((v) => {
    const l = v.lang.toLowerCase().replace('_', '-')
    return l === locale || l.startsWith(`${prefix}-`) || l === prefix
  })
  if (byLang.length === 0) return null
  // Prefer the exact locale, then a Google / online (natural) voice, then anything.
  return (
    byLang.find((v) => v.lang.toLowerCase().replace('_', '-') === locale && /google|natural|online/i.test(v.name)) ||
    byLang.find((v) => v.lang.toLowerCase().replace('_', '-') === locale) ||
    byLang.find((v) => /google|natural|online/i.test(v.name)) ||
    byLang[0]
  )
}

export type SpeakResult = 'started' | 'empty' | 'no-voice'

/**
 * Wraps the browser's built-in speechSynthesis (text-to-speech). Free, no external API.
 * `language` is the language the TEXT is written in (the subject's language) - NOT the
 * student's medium - so every answer is read with a matching voice.
 */
export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false)
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const sessionRef = useRef(0)

  useEffect(() => {
    const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
    setIsSupported(supported)
    if (!supported) return

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices()
    }
    loadVoices()
    // Voices load asynchronously in Chrome / Edge.
    window.speechSynthesis.addEventListener?.('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener?.('voiceschanged', loadVoices)
      window.speechSynthesis.cancel()
    }
  }, [])

  const speak = useCallback(
    (id: string, text: string, language: string = 'en'): SpeakResult => {
      if (!isSupported) return 'empty'

      const lang: SpeechLang = language === 'hi' || language === 'gu' ? language : 'en'
      const spoken = toSpokenText(text, lang)
      if (!spoken) return 'empty'

      window.speechSynthesis.cancel()
      const session = ++sessionRef.current

      if (voicesRef.current.length === 0) voicesRef.current = window.speechSynthesis.getVoices()
      const voice = pickVoice(voicesRef.current, lang)
      // Some phones list no voices up-front but still speak; only report when voices ARE listed and none match.
      const noVoice = !voice && voicesRef.current.length > 0

      const chunks = chunkText(spoken)
      const finish = () => {
        if (sessionRef.current === session) setSpeakingId(null)
      }

      const speakChunk = (index: number) => {
        if (sessionRef.current !== session) return
        if (index >= chunks.length) return finish()

        const utterance = new SpeechSynthesisUtterance(chunks[index])
        utterance.lang = voice?.lang || LOCALE[lang]
        if (voice) utterance.voice = voice
        utterance.rate = lang === 'en' ? 1 : 0.95
        utterance.onstart = () => {
          if (sessionRef.current === session) setSpeakingId(id)
        }
        utterance.onend = () => speakChunk(index + 1)
        utterance.onerror = () => finish()
        window.speechSynthesis.speak(utterance)
      }

      speakChunk(0)
      return noVoice ? 'no-voice' : 'started'
    },
    [isSupported]
  )

  const stop = useCallback(() => {
    if (!isSupported) return
    sessionRef.current++
    window.speechSynthesis.cancel()
    setSpeakingId(null)
  }, [isSupported])

  return { isSupported, speakingId, speak, stop }
}
