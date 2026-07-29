import { create } from 'zustand'

import { createClient } from '@/lib/supabase/client'
import { ScoreSummary, User } from '@/types/users'

interface UserState {
  user: User | null
  isLoading: boolean
  overallSummary: string | null
  overallScore: number // Changed to number
  performanceLabel: string | null // Added
  isGeneratingSummary: boolean
  setUser: (user: User | null) => void
  setIsLoading: (isLoading: boolean) => void
  setOverallSummary: (summary: string | null) => void
  setOverallScore: (score: number) => void
  setPerformanceLabel: (label: string | null) => void
  setIsGeneratingSummary: (isGenerating: boolean) => void
  refreshProfile: () => Promise<void>
  logout: () => Promise<void>
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoading: true,
  overallSummary: null,
  overallScore: 0,
  performanceLabel: null,
  isGeneratingSummary: false,
  setUser: (user) => {
    if (!user) {
      set({ user: null, overallSummary: null, overallScore: 0, performanceLabel: null })
      return
    }

    const { summary, score, label } = parseScoreSummary(user.score_summary)
    set({
      user,
      overallSummary: summary,
      overallScore: score,
      performanceLabel: label,
    })
  },
  setIsLoading: (isLoading) => set({ isLoading }),
  setOverallSummary: (summary) => set({ overallSummary: summary }),
  setOverallScore: (score) => set({ overallScore: score }),
  setPerformanceLabel: (label) => set({ performanceLabel: label }),
  setIsGeneratingSummary: (isGenerating) => set({ isGeneratingSummary: isGenerating }),

  refreshProfile: async () => {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      set({ user: null, isLoading: false })
      return
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(
          `
          id,
          email,
          name,
          role,
          class_id,
          language,
          school_name,
          phone,
          is_active,
          score_summary,
          created_at,
          class:classes(name)
        `
        )
        .eq('id', session.user.id)
        .maybeSingle()

      if (userError) {
        throw userError
      }

      set({
        user: userData as User | null,
        isLoading: false,
      })

      // Update score and summary using the existing userData (setUser handles the parsing now if called, but we'll do it manually here to avoid double set if we want, or just call get().setUser())
      get().setUser(userData as User)
    } catch (error) {
      // This catch block is for actual errors during the supabase call (e.g., network issues, malformed query).
      // A missing profile (userData === null) when using maybeSingle() does not trigger this catch block.
      console.error('Error refreshing profile:', error)
      set({ user: null, isLoading: false })
    }
  },

  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({
      user: null,
      isLoading: false,
      overallScore: 0,
      overallSummary: null,
      performanceLabel: null,
    })
  },
}))

/**
 * Helper to parse score_summary from the database
 */
function parseScoreSummary(scoreSummary: any): {
  summary: string | null
  score: number
  label: string | null
} {
  let summary: string | null = null
  let score = 0
  let label: string | null = null

  if (!scoreSummary) {
    return { summary, score, label }
  }

  if (typeof scoreSummary === 'object') {
    // Already parsed (jsonb)
    const summaryObj = scoreSummary as unknown as ScoreSummary
    summary = summaryObj.summary || null
    score = summaryObj.overall_score || 0
    label = summaryObj.performance_label || null
  } else if (typeof scoreSummary === 'string') {
    try {
      // Clean string
      let clean = scoreSummary.replace(/```json\n?|```/g, '').trim()
      if (clean.startsWith('"') && clean.endsWith('"')) {
        clean = clean.substring(1, clean.length - 1).trim()
      }
      const parsed = JSON.parse(clean)
      summary = parsed.summary || null
      score = typeof parsed.overall_score === 'number' ? parsed.overall_score : 0
      label = parsed.performance_label || null
    } catch (e) {
      summary = scoreSummary
    }
  }

  return { summary, score, label }
}
