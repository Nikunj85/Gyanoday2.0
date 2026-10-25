/**
 * Classes are stored once PER MEDIUM ("Class 10" exists separately for en / hi / gu),
 * and the admin can attach a chapter to any of them. So "the student's class" is
 * matched by class NAME: every class row with the same name counts as the same class.
 * The chapter's own `language` column then decides which medium's content is shown.
 */
type SupabaseLike = { from: (table: string) => any }

export async function getEquivalentClassIds(
  client: SupabaseLike,
  classId: string | null | undefined
): Promise<string[]> {
  if (!classId) return []
  try {
    const { data: own } = await client.from('classes').select('id, name').eq('id', classId).maybeSingle()
    if (!own?.name) return [classId]
    const { data: siblings } = await client.from('classes').select('id').ilike('name', own.name.trim())
    const ids = new Set<string>([classId, ...((siblings || []).map((c: { id: string }) => c.id))])
    return Array.from(ids)
  } catch {
    return [classId]
  }
}

/** PostgREST `or` expression for a medium. Old chapters without a language count as English. */
export function chapterLanguageFilter(language: string | null | undefined): string {
  const lang = (language || 'en').split('-')[0]
  return lang === 'en' ? 'language.eq.en,language.is.null' : `language.eq.${lang}`
}

export function normalizeMedium(language: string | null | undefined): 'en' | 'hi' | 'gu' {
  const raw = (language || 'en').toString().trim().toLowerCase()
  if (raw.startsWith('hi') || raw.includes('हिं') || raw === 'hindi') return 'hi'
  if (raw.startsWith('gu') || raw.includes('ગુજ') || raw === 'gujarati') return 'gu'
  return 'en'
}
