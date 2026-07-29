export enum PromptKeys {
  PROMPT_CHAPTER_SHORT_SUMMARY = 'PROMPT_CHAPTER_SHORT_SUMMARY',
  PROMPT_MCQ_GENERATOR = 'PROMPT_MCQ_GENERATOR',
  TOTAL_QUESTION_PER_TEST = 'TOTAL_QUESTION_PER_TEST',
  PROMPT_CHATBOT_ANSWER = 'PROMPT_CHATBOT_ANSWER',
  PROMPT_STUDENT_OVERALL_SUMMARY = 'PROMPT_STUDENT_OVERALL_SUMMARY',
  PROMPT_QUIZ_RESULT_SUMMARY = 'PROMPT_QUIZ_RESULT_SUMMARY',
}

export const PromptVariablesMap: Record<PromptKeys, string[]> = {
  [PromptKeys.PROMPT_CHAPTER_SHORT_SUMMARY]: ['language'],
  [PromptKeys.PROMPT_MCQ_GENERATOR]: ['language', 'student_profile', 'total_questions'],
  [PromptKeys.TOTAL_QUESTION_PER_TEST]: ['language', 'student_profile'],
  [PromptKeys.PROMPT_CHATBOT_ANSWER]: [
    'question',
    'language',
    'conversation_history',
    'student_name',
  ],
  [PromptKeys.PROMPT_STUDENT_OVERALL_SUMMARY]: ['language', 'insight_data', 'student_name'],
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
}
