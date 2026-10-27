/**
 * Single source of truth for "which language should AI-generated content
 * (quiz, result summary, smart notes, chatbot, parent summary) be written in".
 *
 * Previously every service had its own copy of this logic (and some passed raw
 * codes such as "hi" / "gu" straight into the prompt), which is why Hindi and
 * Gujarati chapters could still come back in English.
 */

export type ContentLanguage = 'English' | 'Hindi' | 'Gujarati'

/** Normalises any language code / name ("hi", "HIN", "Hindi", "gu-IN") to a label. */
export function languageLabel(language: string | null | undefined): ContentLanguage {
  const normalized = (language || '').trim().toLowerCase().split(/[-_]/)[0]

  if (['hi', 'hin', 'hindi'].includes(normalized)) return 'Hindi'
  if (['gu', 'guj', 'gujarati'].includes(normalized)) return 'Gujarati'
  return 'English'
}

/**
 * Picks the content language for a chapter-based feature.
 *
 * Priority:
 *   1. chapter.language, when it is Hindi / Gujarati
 *   2. subject.language, when it is Hindi / Gujarati (covers chapters whose
 *      language column was left on the default "en" inside a Hindi/Gujarati subject)
 *   3. fallbackLanguage (usually the student's medium) — only if both of the above
 *      are missing, never to override an explicit chapter/subject language
 *   4. English
 */
export function resolveContentLanguage(opts: {
  chapterLanguage?: string | null
  subjectLanguage?: string | null
  /** e.g. a subject literally called "Hindi" or "Gujarati" */
  subjectName?: string | null
  fallbackLanguage?: string | null
}): ContentLanguage {
  const chapter = opts.chapterLanguage ? languageLabel(opts.chapterLanguage) : null
  const subject = opts.subjectLanguage ? languageLabel(opts.subjectLanguage) : null

  if (chapter && chapter !== 'English') return chapter
  if (subject && subject !== 'English') return subject

  // Admins often leave the language dropdown on the default "en" for a Hindi /
  // Gujarati subject. The subject's own name is a reliable signal in that case.
  const fromName = languageFromSubjectName(opts.subjectName)
  if (fromName) return fromName

  if (chapter || subject) return 'English'

  return languageLabel(opts.fallbackLanguage)
}

/** "Hindi", "हिन्दी", "Gujarati", "ગુજરાતી" ... -> language, otherwise null. */
export function languageFromSubjectName(name: string | null | undefined): ContentLanguage | null {
  const n = (name || '').toLowerCase()
  if (!n) return null
  if (/hindi|हिन्दी|हिंदी/.test(n)) return 'Hindi'
  if (/gujarati|ગુજરાતી/.test(n)) return 'Gujarati'
  return null
}

const SCRIPT_NAME: Record<ContentLanguage, string> = {
  English: 'English',
  Hindi: 'Hindi (Devanagari script)',
  Gujarati: 'Gujarati (Gujarati script)',
}

/**
 * Hard language rule appended to prompts in code, so the output language does not
 * depend solely on the admin-editable prompt in the `settings` table.
 * `kind` tells the model what must stay untouched (JSON keys, option letters...).
 */
export function languageEnforcement(
  language: ContentLanguage,
  kind: 'json' | 'json-generic' | 'text' = 'text'
): string {
  if (language === 'English') {
    // Explicit rule: an English subject must stay English even for a Gujarati/Hindi-medium
    // student (and even when the question or the student profile is in another language).
    const englishBase =
      `\n\nLANGUAGE RULE (STRICT): Write every piece of user-facing text in English only. ` +
      `Do NOT use Gujarati, Hindi or any other script, and do not translate into the student's medium or into the language of the question.`
    if (kind === 'json' || kind === 'json-generic') {
      return englishBase + ` The output is JSON: keep every JSON key name exactly as specified and write every string VALUE in English.`
    }
    return englishBase
  }

  const script = SCRIPT_NAME[language]
  const base =
    `\n\nLANGUAGE RULE (STRICT): Write every piece of user-facing text in ${script}. ` +
    `Do NOT answer in English and do NOT transliterate into Latin letters, even if these instructions, ` +
    `the student profile or the source material contain English words. ` +
    `Only well-known proper nouns, formulas and numerals may stay as they are.`

  if (kind === 'json-generic') {
    return (
      base +
      ` The output is JSON: keep every JSON key name exactly as specified (in English) and write every string VALUE in ${language}.`
    )
  }

  if (kind === 'json') {
    return (
      base +
      ` The JSON structure is fixed: keep every JSON key name exactly as specified in English, ` +
      `keep option labels as the letters A, B, C, D and keep "answer_type" / "correct_options" values as English ` +
      `enum values. Every string value for the question, all four options, the explanation, and any ` +
      `summary/profile text must be in ${language}. Set metadata.language to "${language}".`
    )
  }
  return base
}

/**
 * Format rule for the chapter "Smart Summary". Appended in code so the output is always a
 * clean bullet list, whatever wording the admin-editable prompt in `settings` uses.
 */
export function summaryFormatInstruction(language: ContentLanguage): string {
  return (
    `\n\nOUTPUT FORMAT (STRICT): Return ONLY 3 to 4 concise bullet points, with no heading, introduction, or closing line. ` +
    `Each bullet must be on its own line and start with "- ". Each bullet should contain one short, student-friendly sentence. ` +
    `Cover the chapter's main idea, important concepts/events, and what to remember for revision. ` +
    `Everything, including any key terms, must be written in ${language}.`
  )
}

/** Normalises model output into clean "- " markdown bullets. */
export function normalizeBulletSummary(raw: string): string {
  const cleaned = (raw || '')
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()

  return cleaned
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^([•●▪◦*–—]|\d+[.)])\s*/, '- ').replace(/^-(?!\s)/, '- '))
    .map((line) => (line.startsWith('- ') ? line : `- ${line}`))
    .join('\n')
}

/**
 * Student-facing language policy: ordinary subjects use the student's medium;
 * language subjects always use their own language (English/Hindi/Gujarati).
 */
export function resolveStudentContentLanguage(
  studentMedium: string | null | undefined,
  subjectName: string | null | undefined,
  subjectLanguage?: string | null
): ContentLanguage {
  // Named language subjects always keep their own language, regardless of the
  // student's medium. This is deliberately checked before the student's medium.
  const subject = languageFromSubjectName(subjectName)
  if (subject) return subject
  const normalizedName = (subjectName || '').trim().toLowerCase()
  if (/^english(?:\s|$)/i.test(normalizedName) || normalizedName === 'eng') return 'English'

  // Some schools use generic names (e.g. "Second Language") but set the
  // subject's language column. Only Hindi/Gujarati override the medium here;
  // an ordinary subject marked English should still follow the student's medium.
  const configuredSubjectLanguage = subjectLanguage ? languageLabel(subjectLanguage) : null
  if (configuredSubjectLanguage === 'Hindi' || configuredSubjectLanguage === 'Gujarati') {
    return configuredSubjectLanguage
  }

  // The chapter's stored language is not used for ordinary subjects: student
  // medium controls Maths, Science, Social Science, etc.
  return languageLabel(studentMedium)
}


/** Short code (en / hi / gu) for a ContentLanguage label. */
export function contentLanguageKey(language: ContentLanguage): 'en' | 'hi' | 'gu' {
  return language === 'Hindi' ? 'hi' : language === 'Gujarati' ? 'gu' : 'en'
}

/**
 * Looks at the script of some generated text and reports whether it is written in the
 * expected language. Used to reject cached / freshly generated content that is in the wrong
 * language (e.g. Gujarati smart notes stored for an English subject).
 * Pure function - safe to import from client components.
 */
export function textMatchesLanguage(value: unknown, expected: ContentLanguage): boolean {
  const text = typeof value === 'string' ? value : JSON.stringify(value ?? '')
  const gujarati = (text.match(/[\u0A80-\u0AFF]/g) || []).length
  const devanagari = (text.match(/[\u0900-\u097F]/g) || []).length
  const latin = (text.match(/[A-Za-z]/g) || []).length
  // JSON keys / LaTeX / option letters are Latin, so use generous thresholds.
  if (expected === 'Gujarati') return gujarati > 0 && gujarati >= devanagari && gujarati * 3 >= latin * 0.25
  if (expected === 'Hindi') return devanagari > 0 && devanagari >= gujarati && devanagari * 3 >= latin * 0.25
  return gujarati + devanagari <= (gujarati + devanagari + latin) * 0.03
}