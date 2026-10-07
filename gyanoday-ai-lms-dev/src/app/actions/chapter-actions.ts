'use server'

import {
  languageEnforcement,
  normalizeBulletSummary,
  resolveContentLanguage,
  summaryFormatInstruction,
} from '@/lib/ai/language'
import { buildPrompt } from '@/lib/ai/promptUtils'
import { PromptKeys } from '@/lib/constants/prompt_keys'
import { openAIService } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { settingsService } from '@/services/settings-server-service'

/**
 * Server action to generate a summary for a chapter based on its uploaded PDF.
 *
 * @param chapterId The ID of the chapter to update.
 * @param pdfUrl The public URL of the PDF stored in Supabase Storage.
 */
export async function generateChapterSummary(chapterId: string, pdfUrl: string, language: string) {
  try {
    // Always derive the generation language from the chapter's subject. The
    // value passed by the UI may be stale on older chapter rows.
    const { data: chapter, error: chapterError } = await supabaseAdmin
      .from('chapters')
      .select('language, subject:subjects(language, name)')
      .eq('id', chapterId)
      .maybeSingle()

    if (chapterError) throw chapterError

    const subject = Array.isArray((chapter as any)?.subject)
      ? (chapter as any).subject[0]
      : (chapter as any)?.subject
    // Resolve to a readable label ("Hindi"), never a raw code ("hi") — the raw
    // code was being dropped straight into the prompt, so the model replied in
    // English and that English text was then saved as the chapter description.
    const generationLanguage = resolveContentLanguage({
      chapterLanguage: chapter?.language,
      subjectLanguage: subject?.language,
      subjectName: subject?.name,
      fallbackLanguage: language,
    })

    const setting = await settingsService.getSettingBasedOnKey(
      PromptKeys.PROMPT_CHAPTER_SHORT_SUMMARY
    )

    const prompt =
      buildPrompt(PromptKeys.PROMPT_CHAPTER_SHORT_SUMMARY, setting.value, {
        language: generationLanguage,
      }) +
      languageEnforcement(generationLanguage, 'text') +
      summaryFormatInstruction(generationLanguage)

    const rawSummary = await openAIService.generateResultFromFile(pdfUrl, prompt)
    const summary = normalizeBulletSummary(rawSummary)

    // 5️⃣ Update Database
    const supabase = await createClient()
    const { error: updateError } = await supabase
      .from('chapters')
      .update({ description: summary })
      .eq('id', chapterId)

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    return {
      success: true,
      summary,
      message: 'Summary generated and updated successfully.',
    }
  } catch (error: any) {
    console.error('Error in generateChapterSummary action:', error)

    return {
      success: false,
      error: error.message || 'An unexpected error occurred during summary generation.',
    }
  }
}
