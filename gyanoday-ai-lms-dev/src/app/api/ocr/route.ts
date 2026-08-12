import { NextRequest, NextResponse } from 'next/server'

import { openAIService } from '@/lib/openai'

export const runtime = 'nodejs'

/**
 * AI-based OCR fallback. Only called when the free, on-device engine
 * (tesseract.js, run in the browser) produces a low-confidence result —
 * e.g. messy handwriting or a poor-quality photo. Keeps the common,
 * easy case free and only spends on the harder cases.
 */
export async function POST(req: NextRequest) {
  try {
    const { imageDataUrl } = await req.json()

    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return NextResponse.json({ error: 'imageDataUrl is required' }, { status: 400 })
    }

    const text = await openAIService.extractTextFromImage(imageDataUrl)
    return NextResponse.json({ text })
  } catch (error) {
    console.error('OCR fallback error:', error)
    return NextResponse.json(
      { error: 'Failed to read text from the image. Please try again or type your question.' },
      { status: 500 }
    )
  }
}
