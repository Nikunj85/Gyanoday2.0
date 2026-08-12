'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// Minimal typing for the (non-standard, vendor-prefixed) Web Speech API.
// Not all browsers implement this; we feature-detect at runtime.
interface SpeechRecognitionResultLike {
  transcript: string
}
interface SpeechRecognitionEventLike extends Event {
  results: { [index: number]: { [index: number]: SpeechRecognitionResultLike; isFinal: boolean } }
  resultIndex: number
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: Event) => void) | null
  onend: (() => void) | null
}

const langMap: Record<string, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  gu: 'gu-IN',
}

/**
 * Wraps the browser's built-in SpeechRecognition (voice-to-text). Free,
 * no external API, works out of the box on Chrome/Edge/Safari on most
 * devices. On browsers without support, `isSupported` is false and the
 * caller should hide the mic button.
 */
export function useSpeechRecognition(language: string = 'en') {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [interimTranscript, setInterimTranscript] = useState('')
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const onFinalResultRef = useRef<((text: string) => void) | null>(null)

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognitionCtor) {
      setIsSupported(false)
      return
    }
    setIsSupported(true)

    const recognition: SpeechRecognitionLike = new SpeechRecognitionCtor()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = langMap[language] || 'en-US'

    recognition.onresult = (event) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < Object.keys(event.results).length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (interim) setInterimTranscript(interim)
      if (final && onFinalResultRef.current) {
        onFinalResultRef.current(final)
        setInterimTranscript('')
      }
    }

    recognition.onerror = () => {
      setIsListening(false)
      setInterimTranscript('')
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
  }, [language])

  const startListening = useCallback((onFinalResult: (text: string) => void) => {
    if (!recognitionRef.current) return
    onFinalResultRef.current = onFinalResult
    try {
      recognitionRef.current.start()
      setIsListening(true)
    } catch {
      // start() throws if already started; ignore
    }
  }, [])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return { isListening, isSupported, interimTranscript, startListening, stopListening }
}
