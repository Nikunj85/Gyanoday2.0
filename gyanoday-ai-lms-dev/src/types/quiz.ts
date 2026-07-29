export interface Option {
  id: string
  label: string
  text: string
}

export interface QuizQuestion {
  id: string
  text: string
  type: 'single' | 'multiple'
  options: Option[]
  correctAnswerIds: string[]
  questionImage?: string
  studentAnswers?: string[]
}

export interface QuizAttemptStats {
  score: number
  correctCount: number
  totalQuestions: number
  startedAt: string
  submittedAt: string
}

export interface QuizAttempt {
  id: string
  quiz_id: string
  user_id: string
  score: number
  correct_count: number
  total_questions: number
  created_at: string
  started_at: string
  submitted_at: string
}
