import { Language } from './users'

export type Subject = {
  id: string
  name: string
  language: Language
  order_num: number
  is_active: boolean
  created_at: string // ISO timestamp
  image_url?: string | null
  color_code?: string | null
}
