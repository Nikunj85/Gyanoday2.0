export enum UserRole {
  Student = 'student',
  Admin = 'admin',
}

export enum Language {
  EN = 'en',
  GU = 'gu',
  HI = 'hi',
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  [Language.EN]: 'EN',
  [Language.HI]: 'HI',
  [Language.GU]: 'GU',
}

export interface ScoreSummary {
  overall_score: number // 0-100
  performance_label: string // 'Excellent', 'Good', etc.
  summary: string // AI generated 4-5 connected lines
}

export interface User {
  id: string // uuid
  email: string
  name: string
  role: UserRole
  class_id: string | null // FK → classes.id
  language: Language
  school_name: string
  phone: string
  is_active: boolean
  score_summary?: string | ScoreSummary | null // AI generated summary (JSON string of ScoreSummary or the object itself)
  created_at: string // ISO timestamp
  class?: { name: string } // Join reference
}
