import { create, StateCreator } from 'zustand'
import { createJSONStorage, persist, PersistOptions } from 'zustand/middleware'

import { Message } from '@/lib/utils/chatbot-utils'

interface ChatState {
  histories: Record<string, Message[]>
}

interface ChatActions {
  addMessage: (chapterId: string, message: Message) => void
  setMessages: (chapterId: string, messages: Message[]) => void
  clearHistory: (chapterId: string) => void
  getHistory: (chapterId: string) => Message[]
  getRecentContext: (
    chapterId: string,
    limit?: number
  ) => { role: 'user' | 'bot'; content: string }[]
}

type ChatStore = ChatState & ChatActions

type ChatStorePersist = (
  config: StateCreator<ChatStore>,
  options: PersistOptions<ChatStore>
) => StateCreator<ChatStore>

const chatStoreCreator: StateCreator<ChatStore> = (set, get) => ({
  histories: {},

  addMessage: (chapterId, message) =>
    set((state) => {
      const currentHistory = state.histories[chapterId] || []
      // Avoid duplicates based on ID
      if (currentHistory.some((m) => m.id === message.id)) {
        return state
      }
      return {
        histories: {
          ...state.histories,
          [chapterId]: [...currentHistory, message],
        },
      }
    }),

  setMessages: (chapterId, messages) =>
    set((state) => ({
      histories: {
        ...state.histories,
        [chapterId]: messages,
      },
    })),

  clearHistory: (chapterId) =>
    set((state) => {
      const newHistories = { ...state.histories }
      delete newHistories[chapterId]
      return { histories: newHistories }
    }),

  getHistory: (chapterId) => {
    return get().histories[chapterId] || []
  },

  getRecentContext: (chapterId, limit = 5) => {
    const history = get().histories[chapterId] || []
    // Return the last 'limit' messages, mapped to the format needed for the prompt
    return history.slice(-limit).map((m) => ({
      role: m.role as 'user' | 'bot',
      content: m.content,
    }))
  },
})

export const useChatStore = create<ChatStore>()(
  (persist as ChatStorePersist)(chatStoreCreator, {
    name: 'chat-storage',
    storage: createJSONStorage(() => sessionStorage),
    partialize: (state) => ({ histories: state.histories }) as ChatStore,
  })
)
