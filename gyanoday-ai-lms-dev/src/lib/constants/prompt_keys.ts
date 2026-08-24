export enum PromptKeys {
  PROMPT_CHAPTER_SHORT_SUMMARY = 'PROMPT_CHAPTER_SHORT_SUMMARY',
  PROMPT_MCQ_GENERATOR = 'PROMPT_MCQ_GENERATOR',
  TOTAL_QUESTION_PER_TEST = 'TOTAL_QUESTION_PER_TEST',
  PROMPT_CHATBOT_ANSWER = 'PROMPT_CHATBOT_ANSWER',
  PROMPT_SOCRATIC_TUTOR_SYSTEM = 'PROMPT_SOCRATIC_TUTOR_SYSTEM',
  PROMPT_SMART_NOTES_GENERATOR = 'PROMPT_SMART_NOTES_GENERATOR',
  PROMPT_STUDENT_OVERALL_SUMMARY = 'PROMPT_STUDENT_OVERALL_SUMMARY',
  PROMPT_QUIZ_RESULT_SUMMARY = 'PROMPT_QUIZ_RESULT_SUMMARY',
  PROMPT_PARENT_PROGRESS_SUMMARY = 'PROMPT_PARENT_PROGRESS_SUMMARY',
}

export const PromptVariablesMap: Record<PromptKeys, string[]> = {
  [PromptKeys.PROMPT_CHAPTER_SHORT_SUMMARY]: ['language'],
  [PromptKeys.PROMPT_MCQ_GENERATOR]: [
    'language',
    'student_profile',
    'total_questions',
    'topic_focus',
  ],
  [PromptKeys.TOTAL_QUESTION_PER_TEST]: ['language', 'student_profile'],
  [PromptKeys.PROMPT_CHATBOT_ANSWER]: [
    'question',
    'language',
    'conversation_history',
    'student_name',
  ],
  // Static per-chapter persona/rules block. Deliberately does NOT include
  // per-turn variables (question, conversation_history) — it's passed as
  // the Responses API's `instructions` field, kept identical across every
  // message in a chapter's conversation, so the provider's prompt caching
  // can skip re-processing it turn after turn.
  [PromptKeys.PROMPT_SOCRATIC_TUTOR_SYSTEM]: [
    'chapter_title',
    'subject_name',
    'class_name',
    'language',
    'student_name',
  ],
  [PromptKeys.PROMPT_STUDENT_OVERALL_SUMMARY]: ['language', 'insight_data', 'student_name'],
  [PromptKeys.PROMPT_SMART_NOTES_GENERATOR]: ['language', 'chapter_title'],
  [PromptKeys.PROMPT_QUIZ_RESULT_SUMMARY]: [
    'class_name',
    'subject',
    'chapter_name',
    'student_score',
    'correct_answers',
    'total_questions',
    'chapter_avg_score',
    'attempt_count',
    'language',
    'student_name',
    'quiz_data',
  ],
  // Professional-tone counterpart to PROMPT_STUDENT_OVERALL_SUMMARY — same
  // underlying performance data, written for a parent instead of the
  // student: concrete study-time/consistency and concept-mastery language
  // rather than celebratory, second-person coaching.
  [PromptKeys.PROMPT_PARENT_PROGRESS_SUMMARY]: [
    'language',
    'student_name',
    'parent_name',
    'performance_data',
  ],
}
