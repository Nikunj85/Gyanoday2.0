'use client'

import { Bot, Send, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { getChatbotResponse } from '@/app/actions/chatbot-actions'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import {
  CHATBOT_ERROR_MESSAGE,
  CHATBOT_GENERAL_ERROR,
  createBotMessage,
  createUserMessage,
  getWelcomeMessage,
  messageParser,
} from '@/lib/utils/chatbot-utils'
import { useChapterStore } from '@/store/chapter-store'
import { useChatStore } from '@/store/chat-store'
import { useUserStore } from '@/store/user-store'

import MarkdownRenderer from './MarkdownRenderer'

export function AIChatBot() {
  const { toast } = useToast()
  const { activeChapter } = useChapterStore()
  const { user } = useUserStore()
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const chapterId = activeChapter?.id || 'general'

  // Zustand Store
  const EMPTY_MESSAGES: any[] = []
  const messages = useChatStore((state) => state.histories[chapterId]) || EMPTY_MESSAGES
  const addMessage = useChatStore((state) => state.addMessage)

  // Initialize chat if empty
  useEffect(() => {
    // Check if we have messages for this chapter
    const currentMessages = useChatStore.getState().histories[chapterId] || []

    if (currentMessages.length === 0) {
      const chapterLang = activeChapter?.language || user?.language || 'en'
      const welcomeMsg = {
        id: Date.now().toString(),
        role: 'bot' as const,
        content: getWelcomeMessage(chapterLang),
      }
      addMessage(chapterId, welcomeMsg)
    }
  }, [chapterId, activeChapter?.language, user?.language, addMessage])

  // Simple toggle
  const toggleChat = () => {
    setIsOpen(!isOpen)
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) {
      scrollToBottom()
    }
  }, [messages, isOpen, isTyping])

  // --- Action Provider Logic ---
  const actions = {
    handleUserMessage: async (content: string) => {
      const userMessage = createUserMessage(content)

      // Get context before adding the new message to avoid duplication in prompt
      // We want the history of PREVIOUS exchanges, not including the current question
      const historyContext = useChatStore.getState().getRecentContext(chapterId, 5)

      // Add message to store
      addMessage(chapterId, userMessage)

      setIsTyping(true)

      try {
        // If we have an active chapter, use the AI service with chapterId
        if (activeChapter?.id) {
          // Format history for the prompt
          const formattedHistory = historyContext
            .map((msg) => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`)
            .join('\n')

          const result = await getChatbotResponse(
            activeChapter.id,
            content,
            formattedHistory,
            user?.name
          )

          if (result.success && result.answer) {
            actions.addBotMessage(result.answer)
          } else {
            const errorMessage = result.error || CHATBOT_ERROR_MESSAGE
            actions.addBotMessage(errorMessage)
            toast({
              variant: 'destructive',
              title: 'Chatbot Error',
              description: errorMessage,
            })
          }
        } else {
          // Fallback to simple message parser if no PDF is available
          const response = messageParser.parse(content)
          actions.addBotMessage(response)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : CHATBOT_GENERAL_ERROR
        actions.addBotMessage(CHATBOT_GENERAL_ERROR)
        toast({
          variant: 'destructive',
          title: 'Error',
          description: errorMsg,
        })
      } finally {
        setIsTyping(false)
      }
    },
    addBotMessage: (content: string) => {
      const botMessage = createBotMessage(content)
      addMessage(chapterId, botMessage)
    },
  }

  const handleSend = () => {
    if (!inputValue.trim()) return
    actions.handleUserMessage(inputValue.trim())
    setInputValue('')
  }

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex flex-col items-end">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-32px)] sm:w-[380px] h-[550px] max-h-[calc(100vh-100px)] bg-white rounded-[30px] shadow-2xl border border-neutral-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-primary p-5 flex items-center justify-between text-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                <Bot size={22} />
              </div>
              <div>
                <h3 className="font-bold">Gyanoday AI</h3>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse" />
                  <p className="text-[10px] text-white/70 uppercase tracking-wider font-bold">
                    Online
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-neutral-50/50 scroll-smooth custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300',
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm text-white  text-xs uppercase',
                    msg.role === 'user' ? 'bg-shiny-shamrock font-bold  ' : 'bg-primary text-white'
                  )}
                >
                  {msg.role === 'user' ? getInitials(user?.name || 'User') : <Bot size={16} />}
                </div>
                <div
                  className={cn(
                    'max-w-[80%] p-3 rounded-2xl text-sm font-medium leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-white text-neutral-800 rounded-br-none shadow-sm border border-neutral-100'
                      : 'bg-primary text-white rounded-bl-none shadow-md'
                  )}
                >
                  <MarkdownRenderer
                    content={msg.content}
                    className=" prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white prose-a:text-white prose-li:text-white"
                  />
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 text-primary animate-pulse">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Bot size={16} />
                </div>
                <div className="bg-primary/10 px-4 py-2 rounded-2xl flex gap-1">
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-neutral-100 shrink-0">
            <div className="relative flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type a message..."
                className="flex-1 px-4 py-3 text-white bg-primary rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
              <button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                className="p-3 bg-primary text-white rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shrink-0 disabled:opacity-50 disabled:scale-100 disabled:hover:scale-100"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky GIF Button */}
      <button
        onClick={toggleChat}
        className="relative w-24 h-24 sm:w-32 sm:h-32 transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer"
        aria-label="Toggle AI Chat"
      >
        {/* Tooltip/Label on Hover */}
        <div className="absolute right-0 bg-primary text-white text-[10px] uppercase tracking-widest font-bold py-1.5 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 whitespace-nowrap shadow-lg pointer-events-none z-20">
          Ask SIKSHA ✨
        </div>

        {/* Background Glow Effect */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-75 group-hover:scale-110" />

        {/* AI GIF */}
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          <Image
            src="/AI.gif"
            alt="AI Bot"
            width={120}
            height={120}
            className="w-[85%] h-[85%] object-contain drop-shadow-xl"
            unoptimized
          />
        </div>
      </button>
    </div>
  )
}
