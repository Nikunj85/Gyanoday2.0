import { Language } from './users'

export interface Class {
  id: string
  name: string
  order_num: number
  is_active: boolean
  language: Language
  students_count?: number
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: string
  subject_id: string
  class_id: string
  title: string
  description?: string
  order_num: number
  is_visible: boolean
  language: Language
  pdf_url?: string
  file_id?: string
  vector_store_id?: string
  video_url?: string
  test_count?: number
  created_at: string
  updated_at: string
  subject?: { name: string }
  class?: { name: string }
}

export interface Subject {
  id: string
  name: string
  order_num: number
  is_active: boolean
  language: Language
  created_at: string
  image_url?: string | null
  color_code?: string | null
}

export interface UserChapterProgress {
  id: string
  user_id: string
  chapter_id: string
  is_completed: boolean
  test_count?: number
  completed_at?: string
}

export interface AIInsight {
  id: string
  user_id: string
  chapter_id: string
  language: string
  insight_text: string
  weak_areas: any
  score_context: any
  created_at: string
}

export interface StreakDayData {
  day: string
  date: number
  status: string
  gif?: string
  color?: string
  isToday?: boolean
  isFuture?: boolean
  quizzes?: number
  chapters?: number
  fullDate?: string // Appended from server action DayActivity
  label?: string | Record<string, string>
}

export interface StreakRule {
  key: string
  priority: number
  conditions: {
    isToday?: boolean
    quizzes?: number
    chapters?: number
    min_quizzes?: number
    min_chapters?: number
    any_activity?: boolean
  }
  emoji: string
  emoji_name: string
  gif: string
  color: string
  meaning: string | Record<string, string>
  label: string | Record<string, string>
}
