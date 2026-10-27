import { languageEnforcement, resolveStudentContentLanguage, textMatchesLanguage } from '@/lib/ai/language'
import { buildPrompt } from '@/lib/ai/promptUtils'
import { SmartNotesSchema } from '@/lib/constants/smart_notes_keys'
import { PromptKeys } from '@/lib/constants/prompt_keys'
import { openAIService } from '@/lib/openai'
import { supabaseAdmin } from '@/lib/supabase/admin'

import { chapterServerService } from '../chapter-server-service'
import { settingsService } from '../settings-server-service'

export const smartNotesAiService = {
  /**
   * Generates the three-layer Smart Notes content for a chapter:
   * - core_layer: the main explanatory text (markdown + LaTeX)
   * - interactive_layer: active-recall prompt/answer pairs
   * - feedback_layer: small instant-check MCQ modules
   *
   * Admin-triggered (not on the student's hot path), so this uses the
   * simpler non-streaming generation — a one-time ~10-20s wait when an
   * admin (re)generates notes for a chapter is an acceptable tradeoff for
   * the reliability of a single blocking, fully-validated call.
   */
  async generateSmartNotes(chapterId: string, studentMedium: string = 'en') {
    const [fileId, chapter, promptSetting] = await Promise.all([
      chapterServerService.getOrUploadChapterFileId(chapterId),
      chapterServerService.getChapterById(chapterId),
      settingsService.getSettingBasedOnKey(PromptKeys.PROMPT_SMART_NOTES_GENERATOR),
    ])

    if (!chapter || !chapter.pdf_url) {
      throw new Error('Chapter or PDF URL not found')
    }
    if (!promptSetting) {
      throw new Error('Smart Notes prompt setting not configured.')
    }

    const { data: subject } = await supabaseAdmin
      .from('subjects')
      .select('language, name')
      .eq('id', chapter.subject_id)
      .maybeSingle()

    const language = resolveStudentContentLanguage(studentMedium, subject?.name)

    const basePrompt = buildPrompt(PromptKeys.PROMPT_SMART_NOTES_GENERATOR, promptSetting.value, {
      language,
      chapter_title: chapter.title,
    })

    // Generate, then verify the output script really is the subject's language. If the model
    // drifted (e.g. wrote Gujarati for the English subject because of the student's medium),
    // retry once with an even stricter instruction instead of saving the wrong-language notes.
    let notes: any
    for (let attempt = 0; attempt < 2; attempt++) {
      const strict =
        attempt === 0
          ? ''
          : `\n\nIMPORTANT: the previous attempt was written in the wrong language. This chapter belongs to the ${language} subject, so EVERY string value must be written in ${language} only, regardless of the student's medium.`
      notes = await openAIService.generateResultWithSchema({
        fileId,
        prompt: basePrompt + languageEnforcement(language, 'json') + strict,
        schema: SmartNotesSchema,
        schemaName: 'smart_notes',
      })
      if (textMatchesLanguage(notes, language)) return notes
    }
    throw new Error(`Smart Notes could not be generated in ${language}. Please try again.`)
  },
}