/**
 * Classes are stored once per medium and board. Treat same-named class rows as
 * equivalent only when they belong to the same board; the chapter's language then
 * selects the student's medium-specific curriculum.
 */
type SupabaseLike = { from: (table: string) => any }

export async function getEquivalentClassIds(
  client: SupabaseLike,
  classId: string | null | undefined
): Promise<string[]> {
  if (!classId) return []
  try {
    const { data: own } = await client
      .from('classes')
      .select('id, name, board_id')
      .eq('id', classId)
      .maybeSingle()
    if (!own?.name) return [classId]

    let siblingsQuery = client
      .from('classes')
      .select('id')
      .ilike('name', own.name.trim())

    // Class 10 from CBSE must never be mixed with Class 10 from Gujarat Board.
    // Equivalent class rows are only the different-medium rows for the same board.
    siblingsQuery = own.board_id
      ? siblingsQuery.eq('board_id', own.board_id)
      : siblingsQuery.is('board_id', null)

    const { data: siblings } = await siblingsQuery
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
