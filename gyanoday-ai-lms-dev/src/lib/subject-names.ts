/**
 * Subjects are shared containers: the same "Science" subject holds both the
 * English-medium and Hindi-medium chapters (the chapter row carries the
 * language). So the subject *name* has to be localised for display, otherwise a
 * Hindi-medium student sees "Science" above Hindi chapters.
 *
 * If the admin created a dedicated subject in the student's language (e.g. a
 * subject literally named "विज्ञान") its own name is already in that script and
 * is returned untouched.
 */
type Lang = 'en' | 'hi' | 'gu'

const NAMES: Record<string, { hi: string; gu: string }> = {
  english: { hi: 'अंग्रेज़ी', gu: 'અંગ્રેજી' },
  hindi: { hi: 'हिंदी', gu: 'હિન્દી' },
  gujarati: { hi: 'गुजराती', gu: 'ગુજરાતી' },
  sanskrit: { hi: 'संस्कृत', gu: 'સંસ્કૃત' },
  science: { hi: 'विज्ञान', gu: 'વિજ્ઞાન' },
  mathematics: { hi: 'गणित', gu: 'ગણિત' },
  maths: { hi: 'गणित', gu: 'ગણિત' },
  math: { hi: 'गणित', gu: 'ગણિત' },
  'social science': { hi: 'सामाजिक विज्ञान', gu: 'સામાજિક વિજ્ઞાન' },
  'social studies': { hi: 'सामाजिक अध्ययन', gu: 'સામાજિક અભ્યાસ' },
  'health and physical education': {
    hi: 'स्वास्थ्य एवं शारीरिक शिक्षा',
    gu: 'આરોગ્ય અને શારીરિક શિક્ષણ',
  },
  'physical education': { hi: 'शारीरिक शिक्षा', gu: 'શારીરિક શિક્ષણ' },
  'computer science': { hi: 'कंप्यूटर विज्ञान', gu: 'કમ્પ્યુટર વિજ્ઞાન' },
  computer: { hi: 'कंप्यूटर', gu: 'કમ્પ્યુટર' },
  physics: { hi: 'भौतिक विज्ञान', gu: 'ભૌતિક વિજ્ઞાન' },
  chemistry: { hi: 'रसायन विज्ञान', gu: 'રસાયણ વિજ્ઞાન' },
  biology: { hi: 'जीव विज्ञान', gu: 'જીવવિજ્ઞાન' },
  history: { hi: 'इतिहास', gu: 'ઇતિહાસ' },
  geography: { hi: 'भूगोल', gu: 'ભૂગોળ' },
  civics: { hi: 'नागरिक शास्त्र', gu: 'નાગરિકશાસ્ત્ર' },
  economics: { hi: 'अर्थशास्त्र', gu: 'અર્થશાસ્ત્ર' },
  'political science': { hi: 'राजनीति विज्ञान', gu: 'રાજ્યશાસ્ત્ર' },
  accountancy: { hi: 'लेखाशास्त्र', gu: 'હિસાબી શાસ્ત્ર' },
  art: { hi: 'कला', gu: 'કલા' },
  'environmental studies': { hi: 'पर्यावरण अध्ययन', gu: 'પર્યાવરણ અભ્યાસ' },
}

export function normalizeLang(lng?: string | null): Lang {
  const primary = (lng || 'en').split('-')[0]
  return primary === 'hi' || primary === 'gu' ? primary : 'en'
}

/** Returns the subject name in the given medium (falls back to the stored name). */
export function localizeSubjectName(name: string | null | undefined, lng?: string | null): string {
  if (!name) return ''
  const lang = normalizeLang(lng)
  if (lang === 'en') return name
  // Already written in a non-Latin script → the admin entered it for this medium.
  if (/[^\u0000-ɏ]/.test(name)) return name
  return NAMES[name.trim().toLowerCase().replace(/\s+/g, ' ')]?.[lang] ?? name
}
