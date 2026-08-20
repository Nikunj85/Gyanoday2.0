export interface SmartNotesInteractiveItem {
  prompt: string
  answer: string
}

export interface SmartNotesFeedbackQuestion {
  question: string
  options: string[]
  correct_answer: string
}

export interface SmartNotes {
  core_layer: string
  interactive_layer: SmartNotesInteractiveItem[]
  feedback_layer: SmartNotesFeedbackQuestion[]
}

