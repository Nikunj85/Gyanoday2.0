import { NextRequest, NextResponse } from 'next/server'

import { requireUser } from '@/lib/auth/guards'
import { openAIService } from '@/lib/openai'

export const runtime = 'nodejs'

/**
 * AI-based OCR fallback. Only called when the free, on-device engine
 * (tesseract.js, run in the browser) produces a low-confidence result —
 * e.g. messy handwriting or a poor-quality photo. Keeps the common,
 * easy case free and only spends on the harder cases.
 */
const MAX_IMAGE_CHARS = 8_000_000 // ~6 MB of base64

export async function POST(req: NextRequest) {
  try {
    await requireUser()
  } catch {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    const { imageDataUrl } = await req.json()

    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      return NextResponse.json({ error: 'imageDataUrl is required' }, { status: 400 })
    }
    if (!imageDataUrl.startsWith('data:image/') || imageDataUrl.length > MAX_IMAGE_CHARS) {
      return NextResponse.json({ error: 'Please upload a smaller image.' }, { status: 413 })
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
