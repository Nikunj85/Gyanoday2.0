/**
 * Extra translations merged on top of public/locales/<lng>/common.json.
 *
 *  - `fill`     : only adds keys that are MISSING in the JSON file (safe: never
 *                 replaces a translation you already wrote).
 *  - `override` : replaces the JSON value. Used for the Home + About sections so
 *                 the Hindi medium shows the same content as the English medium.
 *
 * Shape mirrors the JSON files: { common: { ... } }.
 */
import { GU_FILL, GU_OVERRIDE, HI_FILL, HI_OVERRIDE_FEATURES, type Tree } from './i18n-extra-data'

const isObj = (v: unknown): v is Record<string, any> =>
  !!v && typeof v === 'object' && !Array.isArray(v)

function merge(target: any, source: any, overwrite: boolean): any {
  const out = isObj(target) ? { ...target } : {}
  for (const [k, v] of Object.entries(source)) {
    if (isObj(v)) out[k] = merge(out[k], v, overwrite)
    else if (overwrite || out[k] === undefined || out[k] === '') out[k] = v
  }
  return out
}

/* ------------------------------------------------------------------ */
/* HINDI                                                               */
/* ------------------------------------------------------------------ */
const hiFill: Tree = {
  common: {
    today: 'आज',
    subject: 'विषय',
    days_short: { mon: 'सोम', tue: 'मंगल', wed: 'बुध', thu: 'गुरु', fri: 'शुक्र', sat: 'शनि', sun: 'रवि' },
    cancel: 'रद्द करें',
    save: 'सहेजें',
    chapter_notes: {
      placeholder: 'अपने विचार, पैटर्न या याद रखने वाली बातें लिखें…',
      subtitle: '"{{chapter}}" के लिए त्वरित नोट्स जोड़ें।',
      title: 'नोट्स सहेजें',
    },
    quiz: {
      error_title: 'सीमा पूरी हो गई',
      missed: 'यह आपसे छूट गया',
      multiple_hint: 'ध्यान से सोचें! एक से अधिक विकल्प सही हो सकते हैं।',
      quota_exceeded: 'आज के लिए AI क्विज़ की आपकी सीमा पूरी हो गई है। कृपया कल फिर कोशिश करें।',
    },
    quiz_result: {
      insight_error_title: 'लर्निंग इनसाइट उपलब्ध नहीं',
      insight_error_desc:
        'अभी आपका व्यक्तिगत इनसाइट तैयार करने में समस्या आ रही है। चिंता न करें, आपका स्कोर सहेज लिया गया है!',
    },
    profile_page: { unsaved_changes: 'आपके बदलाव सहेजे नहीं गए हैं' },
    subject_header: { start_to_learn: 'सीखना जारी रखें' },
    student_dashboard: {
      ai_summary_short: 'शिक्षा सारांश',
      view_ai_summary: 'शिक्षा प्रेरणा',
      overall_ai_summary: 'शिक्षा प्रेरणा',
      overall_ai_summary_empty: 'अपनी प्रगति का व्यक्तिगत सारांश पाने के लिए एक क्विज़ पूरा करें।',
      empty_summary_subtitle: 'अपनी प्रगति, उपलब्धियाँ और व्यक्तिगत सीखने का रास्ता यहाँ देखने के लिए क्विज़ दें!',
      empty_summary_title: 'अपनी यात्रा शुरू करने के लिए तैयार हैं?',
      generating_summary_title: 'आपकी सीखने की यात्रा का विश्लेषण हो रहा है',
      summary_header: 'आपकी सीखने की यात्रा और प्रगति',
      journey_map: { chapters: 'अध्याय' },
      progress_charts: { weekly_streak: '7 दिन की स्ट्राइक' },
      streak_info_modal: {
        title: '7 दिन की स्ट्राइक',
        description: '7 दिन की स्ट्राइक',
        future_days: 'आने वाले दिन',
        future_days_description: 'सप्ताह के आने वाले दिन। चमकने का समय!',
        got_it: 'समझ गया!',
      },
      motivation: {
        label: 'आज की प्रेरणा',
        fallback: 'सीखते रहो, बढ़ते रहो और अपनी प्रगति पर भरोसा रखो।',
      },
      chapter_list: {
        title: 'विषय और अध्याय',
        subtitle: 'किसी अध्याय को दोहराने के लिए तारा लगाएँ, या बाद के लिए एक छोटा नोट लिखें।',
        chapter: 'अध्याय',
        note: 'नोट',
        revision: 'दोहराव',
        edit_note: 'नोट बदलें',
        add_note: 'नोट जोड़ें',
        marked_revision: 'दोहराव के लिए चिह्नित',
        mark_revision: 'दोहराव के लिए चिह्नित करें',
        note_saved: 'नोट सहेज लिया गया',
        note_save_failed: 'नोट सहेजा नहीं जा सका',
        note_load_failed: 'नोट लोड नहीं हो सका',
        revision_failed: 'दोहराव का निशान बदला नहीं जा सका',
      },
      notes: {
        title: 'मेरे नोट्स',
        new: 'नया नोट',
        title_placeholder: 'नोट का शीर्षक…',
        content_placeholder: 'जो भी याद रखना चाहते हैं, लिखें…',
        empty: 'अभी कोई नोट नहीं — जो भूलना नहीं चाहते, उसे यहाँ लिख लें।',
        empty_content: 'खाली नोट',
      },
      weak_concepts: {
        title: 'मज़बूत और कमज़ोर पक्ष',
        topics_title: 'दोहराने योग्य विषय',
        empty: 'अभी कोई कमज़ोर विषय चिह्नित नहीं — क्विज़ देते रहें, यह यहाँ भर जाएगा।',
      },
      subjects_list: {
        title: 'आपके विषय',
        empty: 'अभी कोई विषय उपलब्ध नहीं।',
        subtitle:
          'विषय के अनुसार प्रगति, मज़बूत पक्ष, कमज़ोर क्षेत्र और दोहराने योग्य टॉपिक देखें। संख्याओं के पीछे का विवरण देखने के लिए किसी भी आइटम पर टैप करें।',
        overall_progress: 'कुल प्रगति',
        chapters_completed_of: '{{total}} में से {{done}} अध्याय पूरे',
        chapters_completed: '{{done}}/{{total}} अध्याय पूरे',
        remaining: '{{count}} शेष',
        strength: 'मज़बूत पक्ष',
        weakness: 'कमज़ोर पक्ष',
        revise_topics: 'दोहराएँ',
        empty_strength: 'मज़बूत पक्ष बनाने के लिए अभ्यास करते रहें।',
        empty_weakness: 'कोई कमज़ोर अध्याय नहीं मिला।',
        empty_revision: 'अभी कोई दोहराने योग्य टॉपिक नहीं।',
        mastery_tracking: 'विषय में निपुणता की ट्रैकिंग',
        open_subject: 'विषय खोलें',
        open_chapter: 'अध्याय खोलें',
        scored: 'स्कोर',
        attempt: 'प्रयास',
        attempts: 'प्रयास',
        flagged: '{{count}} बार चिह्नित',
        in: 'में',
      },
      study_time: {
        title: 'अध्ययन समय',
        subtitle: 'आपकी क्विज़ गतिविधि से दर्ज सीखने का समय',
        this_week: 'इस सप्ताह',
        this_month: 'इस माह',
        weekly: 'साप्ताहिक',
        monthly: 'मासिक',
        tooltip: 'अध्ययन समय',
        range_week: 'सोमवार → रविवार',
        range_month: 'वर्तमान कैलेंडर माह',
        hint: 'अक्ष आपके समय के अनुसार बदलता है • सटीक समय के लिए बार पर टैप करें',
        week_n: 'सप्ताह {{n}}',
      },
    },
  },
}

const hiOverride: Tree = {
  common: {
    hero: {
      title: 'स्मार्ट तरीके से सीखें,',
      'title-1': 'आत्मविश्वास से आगे बढ़ें',
      'title-2': 'ज्ञानोदय AI के साथ',
      subtitle:
        'कक्षा 6 से 12 के छात्रों के लिए AI-संचालित लर्निंग प्लेटफ़ॉर्म — पाठ्यपुस्तक के अध्याय, स्मार्ट नोट्स, क्विज़ और व्यक्तिगत मार्गदर्शन, आपकी अपनी भाषा में।',
      get_started_free: 'मुफ़्त शुरू करें',
      watch_demo: 'डेमो देखें',
    },
    about: {
      label: 'हमारे बारे में',
      headline: 'गुजरात के हर विद्यार्थी के लिए सरल, स्मार्ट और सुलभ शिक्षा',
      paragraphs: [
        'ज्ञानोदय AI कक्षा 6 से 12 के विद्यार्थियों के लिए बनाया गया स्मार्ट ऑनलाइन लर्निंग प्लेटफ़ॉर्म है। यहाँ हर अध्याय के पीडीएफ़ नोट्स, अभ्यास सामग्री और AI-आधारित क्विज़ एक ही जगह मिलते हैं।',
        'हमारा लक्ष्य है कि गाँव से लेकर शहर तक हर बच्चे को अपनी माध्यम भाषा में गुणवत्तापूर्ण शिक्षा मिले, ताकि वह बेहतर समझ के साथ आत्मविश्वास से परीक्षा की तैयारी कर सके।',
      ],
    },
    about_page: {
      label: 'हमारे बारे में',
      headline: 'हर विद्यार्थी के लिए सरल, स्मार्ट और सुलभ शिक्षा',
      paragraph1:
        'ज्ञानोदय AI कक्षा 6 से 12 के विद्यार्थियों के लिए बनाया गया स्मार्ट ऑनलाइन लर्निंग प्लेटफ़ॉर्म है, जो बेहतर समझ और परीक्षाओं की तैयारी के लिए पीडीएफ़ नोट्स, अभ्यास सामग्री और AI-आधारित क्विज़ उपलब्ध कराता है।',
      paragraph2:
        'विद्यार्थी अपनी माध्यम भाषा (हिंदी, अंग्रेज़ी या गुजराती) में पढ़ते हैं और उन्हें उसी माध्यम के अध्याय, नोट्स और क्विज़ मिलते हैं। हम हर बच्चे की गति, मज़बूत पक्ष और ज़रूरतों के अनुसार सीखने का अनुभव बनाते हैं।',
      features: [
        'कक्षा 6 से 12 तक स्पष्ट पाठ्यक्रम',
        'हिंदी, अंग्रेज़ी और गुजराती माध्यम',
        'अध्यायवार पीडीएफ़ नोट्स',
        'AI-आधारित क्विज़ और स्मार्ट नोट्स',
        'प्रगति, मज़बूत और कमज़ोर पक्ष की ट्रैकिंग',
        'अभिभावकों के लिए प्रगति डैशबोर्ड',
      ],
    },
    vision_mission: {
      label: 'हमारा विज़न और मिशन',
      headline: 'हर विद्यार्थी के लिए सीखना आसान, सुलभ और प्रभावी बनाना',
      cards: [
        {
          title: 'स्पष्ट शैक्षणिक ढाँचा',
          description:
            'कक्षा 6 से 12 तक सुव्यवस्थित सीखने के रास्ते, जो स्पष्टता, निरंतरता और आत्मविश्वासपूर्ण प्रगति के लिए बनाए गए हैं।',
        },
        {
          title: 'बिना सीमाओं की शिक्षा',
          description:
            'गुणवत्तापूर्ण शिक्षा तक समान पहुँच, जो गुजरात के गाँवों से शहरों तक के विद्यार्थियों को सशक्त बनाती है।',
        },
        {
          title: 'AI-संचालित व्यक्तिगत शिक्षा',
          description:
            'ऐसा व्यक्तिगत मार्गदर्शन जो हर विद्यार्थी की गति, मज़बूत पक्ष और सीखने की ज़रूरतों के अनुसार ढल जाता है।',
        },
      ],
    },
    why_gyanoday: {
      heading: 'ज्ञानोदय क्यों?',
      line1: 'जब पढ़ाई हो',
      line2: 'सरल और स्पष्ट',
      line3: 'तो हर विद्यार्थी',
      line4: 'आत्मविश्वास से सीखता है।',
      line5: 'ज्ञानोदय AI',
      line6: 'आपकी अपनी भाषा में',
      line7: 'पाठ्यपुस्तक के अध्यायों को',
      line8: 'स्मार्ट नोट्स, क्विज़ और AI मार्गदर्शन',
      line9: 'के साथ जोड़ता है, ताकि हर बच्चा',
      line10: 'अपनी गति से आगे बढ़े।',
    },
  },
}

/* ------------------------------------------------------------------ */
/* GUJARATI (dashboard strings only)                                   */
/* ------------------------------------------------------------------ */
const guFill: Tree = {
  common: {
    today: 'આજે',
    subject: 'વિષય',
    days_short: { mon: 'સોમ', tue: 'મંગળ', wed: 'બુધ', thu: 'ગુરુ', fri: 'શુક્ર', sat: 'શનિ', sun: 'રવિ' },
    student_dashboard: {
      motivation: {
        label: 'આજની પ્રેરણા',
        fallback: 'શીખતા રહો, આગળ વધતા રહો અને તમારી પ્રગતિ પર વિશ્વાસ રાખો.',
      },
      chapter_list: {
        title: 'વિષયો અને પાઠ',
        subtitle: 'પાઠ ફરી વાંચવા માટે તારો મૂકો, અથવા પછી માટે નાની નોંધ લખો.',
        chapter: 'પાઠ',
        note: 'નોંધ',
        revision: 'પુનરાવર્તન',
        edit_note: 'નોંધ બદલો',
        add_note: 'નોંધ ઉમેરો',
        marked_revision: 'પુનરાવર્તન માટે ચિહ્નિત',
        mark_revision: 'પુનરાવર્તન માટે ચિહ્નિત કરો',
        note_saved: 'નોંધ સાચવાઈ',
        note_save_failed: 'નોંધ સાચવી શકાઈ નહીં',
        note_load_failed: 'નોંધ લોડ થઈ શકી નહીં',
        revision_failed: 'પુનરાવર્તન ચિહ્ન બદલી શકાયું નહીં',
      },
      subjects_list: {
        title: 'તમારા વિષયો',
        empty: 'હજુ કોઈ વિષય ઉપલબ્ધ નથી.',
        subtitle:
          'વિષય પ્રમાણે પ્રગતિ, મજબૂત બાજુ, નબળા ક્ષેત્રો અને પુનરાવર્તન વિષયો જુઓ. વિગતો માટે કોઈપણ આઇટમ પર ટેપ કરો.',
        overall_progress: 'કુલ પ્રગતિ',
        chapters_completed_of: '{{total}} માંથી {{done}} પાઠ પૂર્ણ',
        chapters_completed: '{{done}}/{{total}} પાઠ પૂર્ણ',
        remaining: '{{count}} બાકી',
        strength: 'મજબૂત બાજુ',
        weakness: 'નબળી બાજુ',
        revise_topics: 'પુનરાવર્તન કરો',
        empty_strength: 'મજબૂત બાજુ બનાવવા પ્રેક્ટિસ ચાલુ રાખો.',
        empty_weakness: 'કોઈ નબળો પાઠ મળ્યો નથી.',
        empty_revision: 'હજુ કોઈ પુનરાવર્તન વિષય નથી.',
        mastery_tracking: 'વિષય નિપુણતા ટ્રેકિંગ',
        open_subject: 'વિષય ખોલો',
        open_chapter: 'પાઠ ખોલો',
        scored: 'સ્કોર',
        attempt: 'પ્રયાસ',
        attempts: 'પ્રયાસ',
        flagged: '{{count}} વાર ચિહ્નિત',
        in: 'માં',
      },
      study_time: {
        title: 'અભ્યાસ સમય',
        subtitle: 'તમારી ક્વિઝ પ્રવૃત્તિમાંથી નોંધાયેલો શીખવાનો સમય',
        this_week: 'આ અઠવાડિયે',
        this_month: 'આ મહિને',
        weekly: 'સાપ્તાહિક',
        monthly: 'માસિક',
        tooltip: 'અભ્યાસ સમય',
        range_week: 'સોમવાર → રવિવાર',
        range_month: 'વર્તમાન કેલેન્ડર મહિનો',
        hint: 'અક્ષ તમારા સમય પ્રમાણે બદલાય છે • ચોક્કસ સમય માટે બાર પર ટેપ કરો',
        week_n: 'અઠવાડિયું {{n}}',
      },
    },
  },
}

const EXTRAS: Record<string, { fill?: Tree; override?: Tree }> = {
  hi: {
    fill: merge(HI_FILL, hiFill, false) as Tree,
    override: merge(hiOverride, HI_OVERRIDE_FEATURES, true) as Tree,
  },
  gu: {
    fill: merge(GU_FILL, guFill, false) as Tree,
    override: GU_OVERRIDE,
  },
}

/** Applies the extras for `language` onto the JSON that was just loaded. */
export function withExtraTranslations(language: string, data: Record<string, any>) {
  const extra = EXTRAS[language.split('-')[0]]
  if (!extra) return data
  let out = data
  if (extra.fill) out = merge(out, extra.fill, false)
  if (extra.override) out = merge(out, extra.override, true)
  return out
}
