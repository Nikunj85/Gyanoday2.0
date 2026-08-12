'use client'

import { Bot, Camera, Loader2, Mic, MicOff, Send, Volume2, VolumeX, X } from 'lucide-react'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'

import { useToast } from '@/components/ui/use-toast'
import { useOCR } from '@/hooks/useOCR'
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition'
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis'
import { cn } from '@/lib/utils'
import {
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

// Marker the streaming route emits if something fails mid-stream (headers
// are already committed by then, so we can't send a normal error status).
const STREAM_ERROR_MARKER = '[[STREAM_ERROR]]'

export function AIChatBot() {
  const { toast } = useToast()
  const { activeChapter } = useChapterStore()
  const { user } = useUserStore()
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isReadingImage, setIsReadingImage] = useState(false)

  const chapterId = activeChapter?.id || 'general'
  const language = activeChapter?.language || user?.language || 'en'

  // Zustand Store
  const EMPTY_MESSAGES: any[] = []
  const messages = useChatStore((state) => state.histories[chapterId]) || EMPTY_MESSAGES
  const addMessage = useChatStore((state) => state.addMessage)
  const appendToMessage = useChatStore((state) => state.appendToMessage)

  // Voice input/output — both free, built into the browser (see Feature 1 doc).
  const { isListening, isSupported: isMicSupported, startListening, stopListening } =
    useSpeechRecognition(language)
  const {
    isSupported: isSpeakerSupported,
    speakingId,
    speak,
    stop: stopSpeaking,
  } = useSpeechSynthesis()

  // OCR ("snap a photo of the problem") — on-device first, AI fallback for hard cases.
  const { recognize, stage: ocrStage } = useOCR()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize chat if empty
  useEffect(() => {
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

  const toggleChat = () => setIsOpen(!isOpen)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [messages, isOpen, isTyping])

  // --- Action Provider Logic ---
  const actions = {
    handleUserMessage: async (content: string) => {
      const userMessage = createUserMessage(content)

      const historyContext = useChatStore.getState().getRecentContext(chapterId, 5)

      addMessage(chapterId, userMessage)

      if (!activeChapter?.id) {
        // No PDF-backed chapter — keep the old lightweight fallback, no
        // streaming possible since there's nothing to stream from.
        const response = messageParser.parse(content)
        actions.addBotMessage(response)
        return
      }

      const formattedHistory = historyContext
        .map((msg) => `${msg.role === 'user' ? 'Student' : 'Tutor'}: ${msg.content}`)
        .join('\n')

      // Create an empty bot message up front and stream tokens into it —
      // this is what makes the answer feel "typed live" instead of
      // appearing all at once after a wait.
      const botMessage = createBotMessage('')
      addMessage(chapterId, botMessage)
      setIsTyping(true)

      try {
        const response = await fetch('/api/chatbot/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chapterId: activeChapter.id,
            question: content,
            history: formattedHistory,
            studentName: user?.name,
          }),
        })

        if (!response.body) {
          throw new Error(CHATBOT_GENERAL_ERROR)
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let sawFirstChunk = false
        let streamedText = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })

          if (chunk.includes(STREAM_ERROR_MARKER)) {
            const [beforeError, errorMsg] = chunk.split(STREAM_ERROR_MARKER)
            if (beforeError) {
              appendToMessage(chapterId, botMessage.id, beforeError)
              streamedText += beforeError
            }
            if (!streamedText.trim()) {
              // Nothing useful streamed before the failure — surface the error.
              appendToMessage(chapterId, botMessage.id, errorMsg || CHATBOT_GENERAL_ERROR)
            }
            toast({
              variant: 'destructive',
              title: 'Chatbot Error',
              description: errorMsg || CHATBOT_GENERAL_ERROR,
            })
            break
          }

          // First chunk arrived — stop showing the "typing…" indicator and
          // let the streamed text itself be the live feedback.
          if (!sawFirstChunk) {
            sawFirstChunk = true
            setIsTyping(false)
          }

          appendToMessage(chapterId, botMessage.id, chunk)
          streamedText += chunk
        }

        if (!streamedText.trim()) {
          appendToMessage(chapterId, botMessage.id, CHATBOT_GENERAL_ERROR)
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : CHATBOT_GENERAL_ERROR
        appendToMessage(chapterId, botMessage.id, errorMsg)
        toast({ variant: 'destructive', title: 'Error', description: errorMsg })
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

  // --- Voice input ---
  const handleMicClick = () => {
    if (isListening) {
      stopListening()
      return
    }
    startListening((finalText) => {
      setInputValue((prev) => (prev ? `${prev} ${finalText}` : finalText))
    })
  }

  // --- Voice output ---
  const handleSpeakClick = (messageId: string, content: string) => {
    if (speakingId === messageId) {
      stopSpeaking()
    } else {
      speak(messageId, content, language)
    }
  }

  // --- OCR / photo input ---
  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-selecting the same file next time
    if (!file) return

    setIsReadingImage(true)
    try {
      const text = await recognize(file)
      if (text) {
        // Drop the recognized text into the box for the student to check
        // and edit before sending — never auto-send.
        setInputValue((prev) => (prev ? `${prev} ${text}` : text))
      } else {
        toast({
          variant: 'destructive',
          title: 'Could not read the image',
          description: 'Please try a clearer photo, or type your question instead.',
        })
      }
    } finally {
      setIsReadingImage(false)
    }
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
                    'relative max-w-[80%] p-3 rounded-2xl text-sm font-medium leading-relaxed group',
                    msg.role === 'user'
                      ? 'bg-white text-neutral-800 rounded-br-none shadow-sm border border-neutral-100'
                      : 'bg-primary text-white rounded-bl-none shadow-md'
                  )}
                >
                  <MarkdownRenderer
                    content={msg.content || ' '}
                    className=" prose-headings:text-white prose-p:text-white prose-strong:text-white prose-code:text-white prose-a:text-white prose-li:text-white"
                  />
                  {msg.role === 'bot' && msg.content && isSpeakerSupported && (
                    <button
                      onClick={() => handleSpeakClick(msg.id, msg.content)}
                      aria-label={speakingId === msg.id ? 'Stop reading aloud' : 'Read aloud'}
                      className="absolute -bottom-2 -right-2 w-6 h-6 bg-white text-primary rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {speakingId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                  )}
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
            {isListening && (
              <p className="text-[11px] text-primary font-semibold mb-1.5 animate-pulse">
                Listening…
              </p>
            )}
            {isReadingImage && (
              <p className="text-[11px] text-primary font-semibold mb-1.5 flex items-center gap-1">
                <Loader2 size={12} className="animate-spin" />
                {ocrStage === 'reading-with-ai'
                  ? 'Having trouble reading it, trying a smarter pass…'
                  : 'Reading your photo…'}
              </p>
            )}
            <div className="relative flex items-center gap-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileSelected}
              />
              <button
                onClick={handleCameraClick}
                disabled={isReadingImage}
                aria-label="Photograph a problem"
                className="p-3 text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-all shrink-0 disabled:opacity-50"
              >
                <Camera size={18} />
              </button>
              {isMicSupported && (
                <button
                  onClick={handleMicClick}
                  aria-label={isListening ? 'Stop voice input' : 'Ask by voice'}
                  className={cn(
                    'p-3 rounded-xl transition-all shrink-0',
                    isListening
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'text-primary bg-primary/10 hover:bg-primary/20'
                  )}
                >
                  {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                </button>
              )}
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type, speak, or snap a photo…"
                className="flex-1 min-w-0 px-4 py-3 text-white bg-primary rounded-2xl text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
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
        <div className="absolute right-0 bg-primary text-white text-[10px] uppercase tracking-widest font-bold py-1.5 px-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 whitespace-nowrap shadow-lg pointer-events-none z-20">
          Ask SIKSHA ✨
        </div>
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-75 group-hover:scale-110" />
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
