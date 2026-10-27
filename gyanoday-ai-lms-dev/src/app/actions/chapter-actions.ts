'use server'

import {
  languageEnforcement,
  normalizeBulletSummary,
  resolveContentLanguage,
  summaryFormatInstruction,
  resolveStudentContentLanguage,
} from '@/lib/ai/language'
import { isOwnStorageUrl, requireAdmin, requireUser } from '@/lib/auth/guards'
import { buildPrompt } from '@/lib/ai/promptUtils'
import { PromptKeys } from '@/lib/constants/prompt_keys'
import { openAIService } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { settingsService } from '@/services/settings-server-service'
import { chapterServerService } from '@/services/chapter-server-service'

/**
 * Server action to generate a summary for a chapter based on its uploaded PDF.
 *
 * @param chapterId The ID of the chapter to update.
 * @param pdfUrl The public URL of the PDF stored in Supabase Storage.
 */
export async function generateChapterSummary(chapterId: string, pdfUrl: string, language: string) {
  try {
    // Admin-only: this spends AI credits and rewrites the chapter description.
    await requireAdmin()

    // Always derive the generation language from the chapter's subject. The
    // value passed by the UI may be stale on older chapter rows.
    const { data: chapter, error: chapterError } = await supabaseAdmin
      .from('chapters')
      .select('language, pdf_url, subject:subjects(language, name)')
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

    // Use the PDF stored on the chapter row, never a URL the browser supplied; and only
    // ever fetch files from our own storage (prevents server-side request forgery).
    const sourcePdfUrl = (chapter as any)?.pdf_url || pdfUrl
    if (!isOwnStorageUrl(sourcePdfUrl)) {
      throw new Error('This chapter has no valid PDF in storage.')
    }

    const rawSummary = await openAIService.generateResultFromFile(sourcePdfUrl, prompt)
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


/** Generate/retrieve a chapter summary in the authenticated student's medium.
 * Language subjects are kept in their own language; other subjects follow the student's medium.
 */
export async function getStudentChapterSummary(chapterId: string) {
  const user = await requireUser()
  if (!chapterId) throw new Error('Chapter ID is required')
  const { data: profile, error: profileError } = await supabaseAdmin.from('users').select('language').eq('id', user.id).maybeSingle()
  if (profileError) throw profileError
  const { data: chapter, error: chapterError } = await supabaseAdmin
    .from('chapters').select('id,title,pdf_url,localized_summaries,subject:subjects(name)')
    .eq('id', chapterId).maybeSingle()
  if (chapterError) throw chapterError
  if (!chapter?.pdf_url) throw new Error('This chapter does not have a PDF document for summary generation.')
  const subject = Array.isArray((chapter as any).subject) ? (chapter as any).subject[0] : (chapter as any).subject
  const language = resolveStudentContentLanguage(profile?.language || 'en', subject?.name)
  const key = language === 'Hindi' ? 'hi' : language === 'Gujarati' ? 'gu' : 'en'
  const cached = (chapter as any).localized_summaries || {}
  if (typeof cached[key] === 'string' && cached[key].trim()) return { summary: cached[key], language }
  const setting = await settingsService.getSettingBasedOnKey(PromptKeys.PROMPT_CHAPTER_SHORT_SUMMARY)
  if (!setting?.value) throw new Error('Chapter summary prompt is not configured. Run SETTINGS_PROMPTS.sql in Supabase.')
  const prompt = buildPrompt(PromptKeys.PROMPT_CHAPTER_SHORT_SUMMARY, setting.value, { language }) + languageEnforcement(language, 'text') + summaryFormatInstruction(language)
  const fileId = await chapterServerService.getOrUploadChapterFileId(chapterId)
  const raw = await openAIService.generateResultFromFileId(fileId, prompt)
  const summary = normalizeBulletSummary(raw)
  const { error: saveError } = await supabaseAdmin.from('chapters').update({ localized_summaries: { ...cached, [key]: summary } }).eq('id', chapterId)
  if (saveError) throw new Error(`Failed to cache chapter summary: ${saveError.message}`)
  return { summary, language }
}
