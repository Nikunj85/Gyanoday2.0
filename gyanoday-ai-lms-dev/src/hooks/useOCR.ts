'use client'

import { useCallback, useState } from 'react'

// Below this confidence (0-100, as reported by tesseract.js), we fall back
// to the AI-based OCR route instead of trusting the on-device result.
const CONFIDENCE_THRESHOLD = 60

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export type OCRStage = 'idle' | 'reading-on-device' | 'reading-with-ai' | 'done' | 'error'

export function useOCR() {
  const [stage, setStage] = useState<OCRStage>('idle')
  const [error, setError] = useState<string | null>(null)

  const recognize = useCallback(async (file: File): Promise<string> => {
    setError(null)
    setStage('reading-on-device')

    const dataUrl = await fileToDataUrl(file)

    try {
      // Dynamic import: tesseract.js is fairly large, so we only load it
      // when a student actually uses the photo-input feature.
      const { default: Tesseract } = await import('tesseract.js')
      const result = await Tesseract.recognize(dataUrl, 'eng')
      const onDeviceText = result.data.text.trim()
      const confidence = result.data.confidence

      if (onDeviceText && confidence >= CONFIDENCE_THRESHOLD) {
        setStage('done')
        return onDeviceText
      }

      // Low confidence (messy handwriting / bad lighting) — fall back to AI.
      setStage('reading-with-ai')
      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      })

      if (!response.ok) {
        // AI fallback failed too — return whatever the on-device pass got,
        // rather than nothing.
        setStage('done')
        return onDeviceText
      }

      const { text } = await response.json()
      setStage('done')
      return (text || onDeviceText || '').trim()
    } catch (err) {
      setStage('error')
      setError(err instanceof Error ? err.message : 'Failed to read text from the image.')
      return ''
    }
  }, [])

  return { recognize, stage, error }
}
