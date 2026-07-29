import { create } from 'zustand'

interface ProgressStats {
  totalChapters: number
  completedChapters: number
  incompleteChapters: number
  averageProgress: number
}

interface ProgressState {
  stats: ProgressStats
  setStats: (stats: ProgressStats) => void
}

export const useCourseProgressStore = create<ProgressState>((set) => ({
  stats: {
    totalChapters: 0,
    completedChapters: 0,
    incompleteChapters: 0,
    averageProgress: 0,
  },
  setStats: (stats) => set({ stats }),
}))
