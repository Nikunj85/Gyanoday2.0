'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpenCheck,
  Flame,
  Info,
  Loader2,
  Search,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { getRecommendedTopics, validateTopicForChapter } from '@/app/actions/concept-actions'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { useQuizStore } from '@/store/use-quiz-store'

interface TopicQuizLauncherProps {
  chapterId: string
  /** Used in the polite "that topic isn't in this chapter" message. */
  chapterTitle?: string
  userId?: string
  /** Full-chapter quiz launch, so this component reuses the same entry point styling. */
  onStartFullQuiz?: () => void
  /** 'gradient' (default) is the purple pill used in the toolbar row.
   * 'header-outline' matches the white-outline pill buttons used inside
   * SubjectHeader's purple banner, so this can drop in as a replacement
   * for the old plain "Quiz Time" button without looking out of place. */
  variant?: 'gradient' | 'header-outline'
  className?: string
}

type Mode = 'full' | 'topic'

interface Copy {
  title: string
  subtitle: string
  tabFull: string
  tabTopic: string
  fullTitle: string
  fullDesc: string
  fullStart: string
  recommended: string
  checking: string
  noWeak: string
  missed: (n: number) => string
  typeOwn: string
  placeholder: string
  start: string
  verifying: string
  offTopic: (chapter: string) => string
  tryThese: string
}

// Built in so the panel reads correctly in all three mediums.
const COPY: Record<string, Copy> = {
  en: {
    title: 'Targeted Practice',
    subtitle: 'Take the full chapter quiz, or drill one specific topic.',
    tabFull: 'Full Chapter Quiz',
    tabTopic: 'Practice a Topic',
    fullTitle: 'Full Chapter Quiz',
    fullDesc: 'Covers everything in the chapter, like a regular test.',
    fullStart: 'Start Full Quiz',
    recommended: 'Recommended for you',
    checking: 'Checking your past attempts…',
    noWeak:
      "No weak areas flagged yet — take a quiz first and we'll recommend topics here based on what trips you up.",
    missed: (n) => `Missed ${n}x recently`,
    typeOwn: 'Or type your own topic',
    placeholder: "e.g. Newton's Second Law",
    start: 'Start',
    verifying: 'Checking…',
    offTopic: (c) =>
      `That topic doesn't seem to be part of ${c ? `"${c}"` : 'this chapter'}. Let's keep to what this chapter covers so your practice counts — you could try one of these instead:`,
    tryThese: 'Topics from this chapter',
  },
  hi: {
    title: 'लक्षित अभ्यास',
    subtitle: 'पूरे अध्याय की क्विज़ दें, या किसी एक विषय का अभ्यास करें।',
    tabFull: 'पूरे अध्याय की क्विज़',
    tabTopic: 'किसी विषय का अभ्यास',
    fullTitle: 'पूरे अध्याय की क्विज़',
    fullDesc: 'अध्याय की हर बात शामिल, जैसे नियमित परीक्षा।',
    fullStart: 'पूरी क्विज़ शुरू करें',
    recommended: 'आपके लिए सुझाव',
    checking: 'आपके पिछले प्रयास देखे जा रहे हैं…',
    noWeak:
      'अभी कोई कमज़ोर विषय नहीं मिला — पहले एक क्विज़ दें, फिर हम यहाँ आपके लिए विषय सुझाएँगे।',
    missed: (n) => `हाल में ${n} बार गलत`,
    typeOwn: 'या अपना विषय लिखें',
    placeholder: 'जैसे: रस के प्रकार',
    start: 'शुरू करें',
    verifying: 'जाँच हो रही है…',
    offTopic: (c) =>
      `यह विषय ${c ? `"${c}"` : 'इस अध्याय'} का हिस्सा नहीं लगता। अभ्यास सार्थक रहे, इसलिए आइए अध्याय के विषयों पर ही रहें — आप इनमें से कोई चुन सकते हैं:`,
    tryThese: 'इस अध्याय के विषय',
  },
  gu: {
    title: 'લક્ષિત પ્રેક્ટિસ',
    subtitle: 'આખા પાઠની ક્વિઝ આપો, અથવા કોઈ એક વિષયની પ્રેક્ટિસ કરો.',
    tabFull: 'આખા પાઠની ક્વિઝ',
    tabTopic: 'વિષયની પ્રેક્ટિસ',
    fullTitle: 'આખા પાઠની ક્વિઝ',
    fullDesc: 'પાઠનું બધું જ આવરી લે છે, નિયમિત પરીક્ષાની જેમ.',
    fullStart: 'સંપૂર્ણ ક્વિઝ શરૂ કરો',
    recommended: 'તમારા માટે સૂચન',
    checking: 'તમારા અગાઉના પ્રયાસો તપાસી રહ્યા છીએ…',
    noWeak:
      'હજી કોઈ નબળો વિષય મળ્યો નથી — પહેલા એક ક્વિઝ આપો, પછી અમે અહીં વિષયો સૂચવીશું.',
    missed: (n) => `તાજેતરમાં ${n} વાર ખોટું`,
    typeOwn: 'અથવા તમારો વિષય લખો',
    placeholder: 'દા.ત. રસના પ્રકાર',
    start: 'શરૂ કરો',
    verifying: 'તપાસી રહ્યા છીએ…',
    offTopic: (c) =>
      `આ વિષય ${c ? `"${c}"` : 'આ પાઠ'} નો ભાગ હોય તેવું લાગતું નથી. પ્રેક્ટિસ ઉપયોગી રહે તે માટે ચાલો પાઠના વિષયો પર જ રહીએ — તમે આમાંથી કોઈ પસંદ કરી શકો:`,
    tryThese: 'આ પાઠના વિષયો',
  },
}

/**
 * Lets a student either take the standard full-chapter quiz, or pick a
 * specific topic/concept for targeted practice. Recommended topics are
 * pulled from their own history of weak areas across past attempts
 * (see concept-insight-service.ts) — this is the "recommends targeted
 * revision" part of the Cognitive Quiz Matrix feature.
 */
export function TopicQuizLauncher({
  chapterId,
  chapterTitle,
  userId,
  onStartFullQuiz,
  variant = 'gradient',
  className,
}: TopicQuizLauncherProps) {
  const router = useRouter()
  const { i18n } = useTranslation()
  const copy = COPY[(i18n.language || 'en').split('-')[0]] || COPY.en
  const initQuiz = useQuizStore((s) => s.initQuiz)
  const [isOpen, setIsOpen] = useState(false)
  const [recommended, setRecommended] = useState<{ topic: string; timesFlagged: number }[]>([])
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false)
  const [customTopic, setCustomTopic] = useState('')
  const [launchingTopic, setLaunchingTopic] = useState<string | null>(null)
  // Default to the topic tab: that's what the "Practice a Topic" button promises.
  const [mode, setMode] = useState<Mode>('topic')
  const [isValidating, setIsValidating] = useState(false)
  const [offTopicSuggestions, setOffTopicSuggestions] = useState<string[] | null>(null)

  // Fetch as soon as we know who the student is (not just when the sheet
  // opens) so the trigger button itself can show a live "you have N weak
  // spots to practice" badge — that's what makes the button worth tapping
  // instead of just a generic label.
  useEffect(() => {
    if (!userId || !chapterId) return
    setIsLoadingRecommended(true)
    getRecommendedTopics(userId, chapterId)
      .then(setRecommended)
      .finally(() => setIsLoadingRecommended(false))
  }, [userId, chapterId])

  const startTopicQuiz = (topic: string) => {
    const trimmed = topic.trim()
    if (!trimmed) return
    setLaunchingTopic(trimmed)
    initQuiz({ chapterId, isReviewMode: false, topic: trimmed })
    router.push('/quiz')
  }

  // Typed topics are checked against the chapter first; recommended / suggested
  // topics already come from this chapter, so they start immediately.
  const submitCustomTopic = async () => {
    const trimmed = customTopic.trim()
    if (!trimmed || isValidating || launchingTopic) return

    setIsValidating(true)
    setOffTopicSuggestions(null)
    try {
      const result = await validateTopicForChapter(chapterId, trimmed)
      if (result.relevant) {
        startTopicQuiz(trimmed)
      } else {
        setOffTopicSuggestions(
          result.suggestions.length > 0 ? result.suggestions : recommended.map((r) => r.topic)
        )
      }
    } finally {
      setIsValidating(false)
    }
  }

  const startFullQuiz = () => {
    if (onStartFullQuiz) {
      onStartFullQuiz()
    } else {
      initQuiz({ chapterId, isReviewMode: false })
      router.push('/quiz')
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button
          className={cn(
            'group relative flex items-center justify-center gap-1.5 h-10 pl-3.5 pr-3 rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95 hover:shadow-md',
            variant === 'gradient' &&
              'text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:via-violet-500 hover:to-purple-500',
            variant === 'header-outline' &&
              'border-2 border-white text-white h-auto py-1.5 justify-center rounded-xl font-bold text-xs xl:text-sm hover:bg-white/10 whitespace-nowrap min-w-[140px] shadow-none',
            className
          )}
        >
          <span>{copy.tabTopic}</span>
        </button>
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[28px] p-0">
        {/* Header banner */}
        <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-indigo-500/10 via-violet-500/10 to-purple-500/10 border-b border-neutral-100 dark:border-neutral-800">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-500/20 shrink-0">
                <Target size={22} />
              </div>
              <div>
                <SheetTitle className="text-xl font-bold">{copy.title}</SheetTitle>
                <SheetDescription className="text-[14px]">{copy.subtitle}</SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {/* Toggle: Full Chapter Quiz | Practice a Topic */}
          <div
            role="tablist"
            className="mt-5 grid grid-cols-2 gap-1 rounded-2xl bg-white/70 dark:bg-neutral-900/70 p-1 border border-neutral-200/70 dark:border-neutral-800"
          >
            {(
              [
                { id: 'full', label: copy.tabFull, icon: <BookOpenCheck size={15} /> },
                { id: 'topic', label: copy.tabTopic, icon: <Target size={15} /> },
              ] as { id: Mode; label: string; icon: React.ReactNode }[]
            ).map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={mode === tab.id}
                onClick={() => setMode(tab.id)}
                className={cn(
                  'flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition-all',
                  mode === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                    : 'text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-100'
                )}
              >
                {tab.icon}
                <span className="truncate">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-6 space-y-7">
          {mode === 'full' ? (
            /* ---------- Full chapter quiz ---------- */
            <div className="flex flex-col items-center text-center gap-4 rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-8">
              <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center">
                <Sparkles size={26} />
              </div>
              <div>
                <p className="text-base font-bold text-neutral-800 dark:text-neutral-100">
                  {copy.fullTitle}
                </p>
                <p className="mt-1 text-sm text-neutral-400">{copy.fullDesc}</p>
              </div>
              <button
                onClick={startFullQuiz}
                className="flex items-center gap-2 px-6 h-11 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md transition-all active:scale-95"
              >
                {copy.fullStart}
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              {/* ---------- Recommended weak areas ---------- */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Flame size={14} className="text-orange-500" />
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                    {copy.recommended}
                  </p>
                </div>

                {isLoadingRecommended ? (
                  <div className="flex items-center gap-2 text-sm text-neutral-400 py-4">
                    <Loader2 size={14} className="animate-spin" />
                    {copy.checking}
                  </div>
                ) : recommended.length === 0 ? (
                  <div className="flex items-start gap-2.5 text-sm text-neutral-400 bg-neutral-50 dark:bg-neutral-900 rounded-2xl p-4 border border-dashed border-neutral-200 dark:border-neutral-800">
                    <Zap size={16} className="shrink-0 mt-0.5 text-neutral-300" />
                    <span>{copy.noWeak}</span>
                  </div>
                ) : (
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <AnimatePresence>
                      {recommended.map((r, idx) => {
                        const isLaunching = launchingTopic === r.topic
                        return (
                          <motion.button
                            key={r.topic}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.04, duration: 0.2 }}
                            onClick={() => startTopicQuiz(r.topic)}
                            disabled={!!launchingTopic}
                            className="group relative flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-left transition-all overflow-hidden border-indigo-200/70 dark:border-indigo-900/60 bg-gradient-to-br from-indigo-50 to-purple-50/50 dark:from-indigo-950/30 dark:to-purple-950/20 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-700 disabled:opacity-60"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 truncate">
                                {r.topic}
                              </p>
                              {r.timesFlagged > 1 && (
                                <p className="text-[11px] font-semibold text-indigo-400 dark:text-indigo-500 mt-0.5">
                                  {copy.missed(r.timesFlagged)}
                                </p>
                              )}
                            </div>
                            {isLaunching ? (
                              <Loader2 size={16} className="text-indigo-500 animate-spin shrink-0" />
                            ) : (
                              <ArrowRight
                                size={16}
                                className="text-indigo-400 group-hover:translate-x-0.5 transition-transform shrink-0"
                              />
                            )}
                          </motion.button>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* ---------- Custom topic (search bar) ---------- */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Search size={14} className="text-neutral-400" />
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                    {copy.typeOwn}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Input
                    value={customTopic}
                    onChange={(e) => {
                      setCustomTopic(e.target.value)
                      if (offTopicSuggestions) setOffTopicSuggestions(null)
                    }}
                    placeholder={copy.placeholder}
                    maxLength={120}
                    className="rounded-xl h-11"
                    onKeyDown={(e) => e.key === 'Enter' && submitCustomTopic()}
                  />
                  <button
                    onClick={submitCustomTopic}
                    disabled={!customTopic.trim() || isValidating || !!launchingTopic}
                    className="shrink-0 flex items-center gap-1.5 px-4 h-11 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:pointer-events-none transition-all"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        {copy.verifying}
                      </>
                    ) : launchingTopic && launchingTopic === customTopic.trim() ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <>
                        {copy.start}
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>
                </div>

                {/* Polite redirect when the topic is not in this chapter */}
                {offTopicSuggestions && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"
                  >
                    <div className="flex items-start gap-2.5">
                      <Info size={16} className="mt-0.5 shrink-0 text-amber-600" />
                      <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-200">
                        {copy.offTopic(chapterTitle || '')}
                      </p>
                    </div>
                    {offTopicSuggestions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {offTopicSuggestions.map((topic) => (
                          <button
                            key={topic}
                            onClick={() => startTopicQuiz(topic)}
                            disabled={!!launchingTopic}
                            className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-800 transition-colors hover:bg-amber-100 disabled:opacity-60 dark:border-amber-800 dark:bg-neutral-900 dark:text-amber-300"
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
