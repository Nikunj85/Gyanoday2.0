import { buildPrompt } from '@/lib/ai/promptUtils'
import { SmartNotesSchema } from '@/lib/constants/smart_notes_keys'
import { PromptKeys } from '@/lib/constants/prompt_keys'
import { openAIService } from '@/lib/openai'

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
  async generateSmartNotes(chapterId: string) {
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

    const prompt = buildPrompt(PromptKeys.PROMPT_SMART_NOTES_GENERATOR, promptSetting.value, {
      language: chapter.language || 'English',
      chapter_title: chapter.title,
    })

    const notes = await openAIService.generateResultWithSchema({
      fileId,
      prompt,
      schema: SmartNotesSchema,
      schemaName: 'smart_notes',
    })

    return notes
  },
}
