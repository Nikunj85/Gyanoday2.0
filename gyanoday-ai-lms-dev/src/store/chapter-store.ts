import { create } from 'zustand'

import { Chapter } from '@/types'

interface ChapterState {
  activeChapter: Chapter | null
  activeSubjectColor: string | null
  setActiveChapter: (chapter: Chapter | null) => void
  setActiveSubjectColor: (color: string | null) => void
}

export const useChapterStore = create<ChapterState>((set) => ({
  activeChapter: null,
  activeSubjectColor: null,
  setActiveChapter: (chapter) => set({ activeChapter: chapter }),
  setActiveSubjectColor: (color) => set({ activeSubjectColor: color }),
}))
