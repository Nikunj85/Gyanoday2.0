'use server'

import { buildPrompt } from '@/lib/ai/promptUtils'
import { PromptKeys } from '@/lib/constants/prompt_keys'
import { openAIService } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { settingsService } from '@/services/settings-server-service'

/**
 * Server action to generate a summary for a chapter based on its uploaded PDF.
 *
 * @param chapterId The ID of the chapter to update.
 * @param pdfUrl The public URL of the PDF stored in Supabase Storage.
 */
export async function generateChapterSummary(chapterId: string, pdfUrl: string, language: string) {
  try {
    const setting = await settingsService.getSettingBasedOnKey(
      PromptKeys.PROMPT_CHAPTER_SHORT_SUMMARY
    )

    const prompt = buildPrompt(PromptKeys.PROMPT_CHAPTER_SHORT_SUMMARY, setting.value, {
      language,
    })

    const summary = await openAIService.generateResultFromFile(pdfUrl, prompt)

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
