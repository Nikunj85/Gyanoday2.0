'use client'

import { BarChart3, BookOpenCheck, Flame, MessageCircleQuestion, Target, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { MotionWrapper } from '@/lib/animations/MotionWrapper'
import { hoverLift } from '@/lib/animations/variants'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  iconBg: string
  index?: number
}

const FeatureCard = ({ icon, title, description, iconBg, index = 0 }: FeatureCardProps) => (
  <MotionWrapper
    animation="fadeInUp"
    delay={index * 0.1}
    duration={0.9}
    whileHover={hoverLift}
    className="bg-white dark:bg-neutral-900 rounded-[24px] p-6 border border-neutral-100 dark:border-neutral-800 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] h-full"
  >
    <div
      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm mb-4"
      style={{ backgroundColor: iconBg }}
    >
      <div className="text-white drop-shadow-sm">{icon}</div>
    </div>
    <h3 className="text-[1.05rem] font-bold text-primary-black dark:text-neutral-100 leading-snug mb-2">
      {title}
    </h3>
    <p className="text-neutral-500 dark:text-neutral-400 text-[0.9rem] leading-[1.6] font-medium">
      {description}
    </p>
  </MotionWrapper>
)

/**
 * Features shown on both the Home and About pages.
 * The registered user's medium controls the language. These local translations
 * also prevent English fallback text when a translation resource is missing.
 */
export default function FeaturesSection() {
  const { t, i18n } = useTranslation()
  const language = (i18n.language || 'en').split('-')[0]

  const content = {
    en: {
      eyebrow: 'What Gyanoday AI Actually Does',
      title: 'Built to guide, not just inform',
      subtitle: 'Every feature below is live in the app today not a roadmap.',
      cards: [
        {
          title: 'A Socratic AI Tutor, Not an Answer Key',
          description:
            'Siksha guides students to the answer with hints and questions instead of handing it over. It only gives a full explanation after a student has genuinely tried and stays focused on the exact chapter being studied.',
        },
        {
          title: 'Adaptive Quizzes That Target Weak Spots',
          description:
            'Quizzes adjust to what a student has actually struggled with, and students can generate a focused quiz on a single concept they want to practise. Every result includes a clear scorecard and answer review.',
        },
        {
          title: 'Living Smart Notes, With Your Own Notes Too',
          description:
            'Every chapter gets smart notes, active-recall flashcards and instant feedback quizzes. Students can also add a personal note or mark a chapter for revision from the chapter list.',
        },
        {
          title: 'A Progress Dashboard Built on Real Data',
          description:
            'Students can see subject completion, strengths, weaknesses, topics to revise, quiz scores, weekly study time and daily streaks in one place.',
        },
        {
          title: 'Daily Streaks & Gentle Reminders',
          description:
            'A personalised progress summary appears on the dashboard, with gentle reminders that encourage students to study consistently without adding pressure.',
        },
        {
          title: 'A Portal for Parents, Too',
          description:
            "Parents get their own simple dashboard with study time, concept mastery, subject strengths and weaknesses, and a plain-language summary of their child's progress.",
        },
      ],
    },
    hi: {
      eyebrow: 'Gyanoday AI वास्तव में क्या करता है',
      title: 'सिर्फ जानकारी नहीं, सही मार्गदर्शन',
      subtitle: 'नीचे दी गई हर सुविधा आज ऐप में उपलब्ध है।',
      cards: [
        {
          title: 'उत्तर बताने वाला नहीं, समझाने वाला AI ट्यूटर',
          description:
            'शिक्षा AI सीधे उत्तर देने के बजाय संकेत और सवालों से विद्यार्थियों को उत्तर तक पहुँचने में मदद करता है। विद्यार्थी प्रयास करने के बाद ही उसे पूरा स्पष्टीकरण मिलता है और मार्गदर्शन उसी अध्याय पर केंद्रित रहता है।',
        },
        {
          title: 'कमज़ोर विषयों पर ध्यान देने वाली क्विज़',
          description:
            'क्विज़ विद्यार्थी की पिछली कठिनाइयों के अनुसार बदलती हैं। विद्यार्थी किसी एक अवधारणा पर अभ्यास के लिए विशेष क्विज़ भी बना सकते हैं और हर परिणाम में स्कोर तथा उत्तर की समीक्षा मिलती है।',
        },
        {
          title: 'स्मार्ट नोट्स और आपके अपने नोट्स',
          description:
            'हर अध्याय में स्मार्ट नोट्स, याददाश्त मजबूत करने वाले फ्लैशकार्ड और तुरंत फीडबैक वाली क्विज़ मिलती हैं। विद्यार्थी अपने नोट्स जोड़ सकते हैं और अध्याय को दोहराने के लिए चिन्हित कर सकते हैं।',
        },
        {
          title: 'वास्तविक डेटा पर आधारित प्रगति डैशबोर्ड',
          description:
            'विद्यार्थी विषय की पूर्णता, मजबूत और कमजोर हिस्से, दोहराने वाले टॉपिक, क्विज़ स्कोर, साप्ताहिक पढ़ाई का समय और दैनिक स्ट्रीक एक ही जगह देख सकते हैं।',
        },
        {
          title: 'दैनिक स्ट्रीक और हल्के रिमाइंडर',
          description:
            'डैशबोर्ड पर व्यक्तिगत प्रगति सारांश मिलता है और हल्के रिमाइंडर विद्यार्थियों को बिना दबाव के नियमित पढ़ाई के लिए प्रेरित करते हैं।',
        },
        {
          title: 'माता-पिता के लिए भी अपना पोर्टल',
          description:
            'माता-पिता को अलग डैशबोर्ड मिलता है जिसमें पढ़ाई का समय, अवधारणाओं की समझ, विषयवार मजबूत और कमजोर हिस्से तथा बच्चे की प्रगति का सरल सारांश दिखाई देता है।',
        },
      ],
    },
    gu: {
      eyebrow: 'Gyanoday AI ખરેખર શું કરે છે',
      title: 'માત્ર માહિતી નહીં, યોગ્ય માર્ગદર્શન',
      subtitle: 'નીચેની દરેક સુવિધા આજે એપમાં ઉપલબ્ધ છે.',
      cards: [
        {
          title: 'જવાબ બતાવતું નહીં, સમજાવતું AI ટ્યુટર',
          description:
            'શિક્ષા AI સીધો જવાબ આપવાને બદલે સંકેતો અને પ્રશ્નો દ્વારા વિદ્યાર્થીઓને જવાબ સુધી પહોંચવામાં મદદ કરે છે. વિદ્યાર્થી પોતે પ્રયાસ કર્યા પછી જ સંપૂર્ણ સમજણ આપવામાં આવે છે અને માર્ગદર્શન સંબંધિત અધ્યાય પર કેન્દ્રિત રહે છે.',
        },
        {
          title: 'નબળા મુદ્દાઓને લક્ષ્ય બનાવતી અનુકૂલનશીલ ક્વિઝ',
          description:
            'ક્વિઝ વિદ્યાર્થીને જ્યાં મુશ્કેલી પડી હોય તેના આધારે બદલાય છે. વિદ્યાર્થી કોઈ એક ખ્યાલ પર અભ્યાસ કરવા માટે ખાસ ક્વિઝ બનાવી શકે છે અને દરેક પરિણામમાં સ્કોર તથા જવાબની સમીક્ષા મળે છે.',
        },
        {
          title: 'સ્માર્ટ નોટ્સ અને તમારા પોતાના નોટ્સ',
          description:
            'દરેક અધ્યાયમાં સ્માર્ટ નોટ્સ, યાદશક્તિ મજબૂત કરતા ફ્લેશકાર્ડ અને તરત ફીડબેક આપતી ક્વિઝ મળે છે. વિદ્યાર્થી પોતાના નોટ્સ ઉમેરી શકે છે અને પુનરાવર્તન માટે અધ્યાયને ચિહ્નિત કરી શકે છે.',
        },
        {
          title: 'વાસ્તવિક ડેટા આધારિત પ્રગતિ ડેશબોર્ડ',
          description:
            'વિદ્યાર્થી વિષયની પૂર્ણતા, મજબૂત અને નબળા મુદ્દાઓ, પુનરાવર્તન માટેના ટોપિક્સ, ક્વિઝ સ્કોર, સાપ્તાહિક અભ્યાસ સમય અને દૈનિક સ્ટ્રીક એક જ જગ્યાએ જોઈ શકે છે.',
        },
        {
          title: 'દૈનિક સ્ટ્રીક અને સરળ રિમાઇન્ડર',
          description:
            'ડેશબોર્ડ પર વ્યક્તિગત પ્રગતિનો સારાંશ મળે છે અને સરળ રિમાઇન્ડર વિદ્યાર્થીઓને દબાણ વગર નિયમિત અભ્યાસ કરવા પ્રોત્સાહિત કરે છે.',
        },
        {
          title: 'માતા-પિતા માટે પણ પોતાનું પોર્ટલ',
          description:
            'માતા-પિતાને અલગ ડેશબોર્ડ મળે છે જેમાં અભ્યાસનો સમય, ખ્યાલોની સમજ, વિષયવાર મજબૂત અને નબળા મુદ્દાઓ તથા બાળકની પ્રગતિનો સરળ સારાંશ દેખાય છે.',
        },
      ],
    },
  } as const

  const selected = content[language as keyof typeof content] || content.en

  // Use existing translation resources when they contain the requested values;
  // otherwise use the guaranteed medium-specific content above.
  const translatedCards = t('common.features_section.cards', { returnObjects: true })
  const cardsFromI18n = Array.isArray(translatedCards) ? translatedCards : []
  const cards = selected.cards.map((card, index) => ({
    ...card,
    ...(cardsFromI18n[index]?.title ? { title: cardsFromI18n[index].title } : {}),
    ...(cardsFromI18n[index]?.description ? { description: cardsFromI18n[index].description } : {}),
  }))

  const eyebrow = t('common.features_section.eyebrow')
  const title = t('common.features_section.title')
  const subtitle = t('common.features_section.subtitle')

  const finalEyebrow = eyebrow && eyebrow !== 'common.features_section.eyebrow' ? eyebrow : selected.eyebrow
  const finalTitle = title && title !== 'common.features_section.title' ? title : selected.title
  const finalSubtitle =
    subtitle && subtitle !== 'common.features_section.subtitle' ? subtitle : selected.subtitle

  const icons = [
    <MessageCircleQuestion key="tutor" size={24} strokeWidth={2.2} />,
    <Target key="quiz" size={24} strokeWidth={2.2} />,
    <BookOpenCheck key="notes" size={24} strokeWidth={2.2} />,
    <BarChart3 key="progress" size={24} strokeWidth={2.2} />,
    <Flame key="streak" size={24} strokeWidth={2.2} />,
    <Users key="parents" size={24} strokeWidth={2.2} />,
  ]

  const iconBgs = ['#8B7CD8', '#E58B99', '#73C6BE', '#D9754E', '#D9A441', '#6BAF8D']

  return (
    <section className="py-20 px-6 md:px-16 lg:px-24 bg-background">
      <MotionWrapper
        animation="fadeInUp"
        duration={0.8}
        className="text-center max-w-2xl mx-auto mb-14"
      >
        <p className="text-primary font-bold uppercase tracking-widest text-sm mb-3">
          {finalEyebrow}
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-primary-black dark:text-neutral-100">
          {finalTitle}
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mt-4 text-[1.05rem] leading-relaxed">
          {finalSubtitle}
        </p>
      </MotionWrapper>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {cards.map((card, index) => (
          <FeatureCard
            key={`${language}-${index}`}
            index={index}
            icon={icons[index]}
            iconBg={iconBgs[index]}
            title={card.title}
            description={card.description}
          />
        ))}
      </div>
    </section>
  )
}
