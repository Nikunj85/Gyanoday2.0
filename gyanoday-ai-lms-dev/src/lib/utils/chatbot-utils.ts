// Types for the modular structure
export type MessageRole = 'user' | 'bot'
export interface Message {
  role: MessageRole
  content: string
  id: string
}

export const CHATBOT_ERROR_MESSAGE =
  "I'm sorry, I couldn't process your question at the moment. Please try again later."
export const CHATBOT_GENERAL_ERROR = 'An error occurred while getting a response. Please try again.'

export const getWelcomeMessage = (lang: string) => {
  switch (lang) {
    case 'hi':
      return 'नमस्ते! मैं शिक्षा हूँ, आपकी AI शिक्षण सहायक। आज मैं इस अध्याय में आपकी कैसे मदद कर सकती हूँ?'
    case 'gu':
      return 'નમસ્તે! હું શિક્ષા છું, તમારી AI શિક્ષણ સહાયક. આજે હું આ પ્રકરણમાં તમને કેવી રીતે મદદ કરી શકું?'
    default:
      return 'Hello! I am Siksha, your AI learning assistant. How can I help you with this chapter today?'
  }
}

// --- Message Parser Logic ---
export const messageParser = {
  parse: (text: string) => {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('hello') || lowerText.includes('hi')) {
      return "Hi there! I'm Sixa, your AI learning assistant. How can I help you with your studies today?"
    }
    if (lowerText.includes('course') || lowerText.includes('subject')) {
      return 'You can find all your courses in your Student Dashboard.'
    }
    if (lowerText.includes('quiz') || lowerText.includes('test')) {
      return "You can take quizzes by clicking the 'Take Quiz' button on any subject page."
    }

    return "That's an interesting question! I'm Sixa, and I'm here to help you understand your course material better."
  },
}

export const createBotMessage = (content: string): Message => {
  return {
    id: (Date.now() + 1).toString(),
    role: 'bot',
    content,
  }
}

export const createUserMessage = (content: string): Message => {
  return {
    id: Date.now().toString(),
    role: 'user',
    content,
  }
}
