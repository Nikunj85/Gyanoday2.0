import { PromptKeys } from '@/lib/constants/prompt_keys'

export interface Setting {
  id: number
  created_at: string
  key: PromptKeys
  value: string
}
