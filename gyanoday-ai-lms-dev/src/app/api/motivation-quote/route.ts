import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const FALLBACK_QUOTES = [
  'Small progress every day becomes a big achievement. Keep going. 🌱',
  'You do not need to be perfect today. You only need to keep learning. ✨',
  'Every difficult topic you understand today makes tomorrow easier. Keep learning. 💪',
  'Believe in your ability to improve. One focused step at a time. 🚀',
  'Your effort today is building the confidence you will need tomorrow. 🌟',
  'Stay curious, stay consistent, and let your progress speak for itself. 📚',
  'A challenging chapter is not a barrier—it is another chance to grow. 🌱',
]

const FALLBACK_QUOTES_HI = [
  'हर दिन की छोटी प्रगति एक दिन बड़ी सफलता बन जाती है। चलते रहो। 🌱',
  'आज परफ़ेक्ट होना ज़रूरी नहीं, बस सीखते रहना ज़रूरी है। ✨',
  'आज जो कठिन विषय समझ लोगे, कल वही आसान लगेगा। सीखते रहो। 💪',
  'खुद पर भरोसा रखो, एक-एक कदम ध्यान से बढ़ाओ। 🚀',
  'आज की मेहनत ही कल का आत्मविश्वास बनेगी। 🌟',
  'जिज्ञासु रहो, नियमित रहो, और अपनी प्रगति को बोलने दो। 📚',
  'कठिन अध्याय रुकावट नहीं, आगे बढ़ने का एक और मौका है। 🌱',
]
const FALLBACK_QUOTES_GU = [
  'દરરોજની નાની પ્રગતિ એક દિવસ મોટી સફળતા બની જાય છે. આગળ વધતા રહો. 🌱',
  'આજે પરફેક્ટ હોવું જરૂરી નથી, બસ શીખતા રહેવું જરૂરી છે. ✨',
  'આજે જે અઘરો વિષય સમજશો, કાલે તે સહેલો લાગશે. શીખતા રહો. 💪',
  'પોતાના પર વિશ્વાસ રાખો, એક એક પગલું ધ્યાનથી ભરો. 🚀',
  'આજની મહેનત જ કાલનો આત્મવિશ્વાસ બનશે. 🌟',
  'જિજ્ઞાસુ રહો, નિયમિત રહો અને તમારી પ્રગતિને બોલવા દો. 📚',
  'અઘરો પાઠ અવરોધ નથી, આગળ વધવાની બીજી તક છે. 🌱',
]
const LANGUAGE_NAMES: Record<string, string> = { en: 'English', hi: 'Hindi (Devanagari script)', gu: 'Gujarati' }

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const langParam = (searchParams.get('lang') || 'en').split('-')[0]
  const lang = langParam in LANGUAGE_NAMES ? langParam : 'en'
  // Only today (±1 day for time zones) is accepted. Arbitrary dates used to bypass the
  // cache and trigger a paid AI call each time; an invalid date also produced `undefined`.
  const today = new Date()
  const requested = searchParams.get('date') || ''
  const requestedMs = /^\d{4}-\d{2}-\d{2}$/.test(requested)
    ? new Date(`${requested}T00:00:00Z`).getTime()
    : NaN
  const withinOneDay =
    Number.isFinite(requestedMs) && Math.abs(requestedMs - today.getTime()) <= 2 * 86_400_000
  const date = withinOneDay ? requested : today.toISOString().slice(0, 10)
  const dayNumber = new Date(`${date}T00:00:00Z`).getUTCDate()

  try {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not configured')

    const response = await openai.responses.create({
      model: 'gpt-4o-mini',
      temperature: 0.9,
      max_output_tokens: 160,
      instructions: 'You are Siksha Inspire, a warm and concise academic motivation assistant for school students.',
      input: `Generate ONE original motivational quote for a student for ${date}. Make it encouraging, practical, and focused on learning, consistency, curiosity, effort, or overcoming challenges. It must be 1 or 2 short lines, maximum 22 words total. Do not use the student's name. Do not add a title, explanation, quotation marks, author name, or hashtags. Return only the quote. Write the quote entirely in ${LANGUAGE_NAMES[lang]}.`,
    })

    const quote = response.output_text?.trim()
    if (!quote) throw new Error('OpenAI returned an empty quote')

    return NextResponse.json(
      { quote, date },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    )
  } catch (error) {
    console.error('[MotivationQuote] Failed to generate quote:', error)
    return NextResponse.json({
      quote: (lang === 'hi' ? FALLBACK_QUOTES_HI : lang === 'gu' ? FALLBACK_QUOTES_GU : FALLBACK_QUOTES)[
        dayNumber % FALLBACK_QUOTES.length
      ],
      date,
      fallback: true,
    })
  }
}
