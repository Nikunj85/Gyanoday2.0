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
    if (!pdfUrl) {
      return {
        success: false,
        error: 'This chapter has no PDF uploaded yet — upload one before generating a summary.',
      }
    }

    const setting = await settingsService.getSettingBasedOnKey(
      PromptKeys.PROMPT_CHAPTER_SHORT_SUMMARY
    )

    const prompt = buildPrompt(PromptKeys.PROMPT_CHAPTER_SHORT_SUMMARY, setting.value, {
      language,
    })

    const summary = await openAIService.generateResultFromFile(pdfUrl, prompt)

    // A blank/near-blank result usually means the model failed silently
    // (empty PDF text extraction, a refusal, a truncated response) rather
    // than genuinely having nothing to say — treat it as a failure instead
    // of overwriting a real summary (or leaving a real gap) with an empty
    // string, which the UI can't distinguish from "not generated yet".
    if (!summary || summary.trim().length < 10) {
      return {
        success: false,
        error: 'The AI returned an empty summary. Please try again — if this keeps happening, check that the PDF has readable text.',
      }
    }

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
