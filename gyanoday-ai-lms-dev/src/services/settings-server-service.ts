import { PromptKeys } from '@/lib/constants/prompt_keys'
import { createClient } from '@/lib/supabase/server'
import { Setting } from '@/types/setting'

export const settingsService = {
  async getSettings(): Promise<Setting[]> {
    const supabase = await createClient()

    const { data, error } = await supabase.from('settings').select('*')

    if (error) throw error

    return data as Setting[]
  },

  async getSettingBasedOnKey(key: string) {
    const supabase = await createClient()

    const { data, error } = await supabase.from('settings').select('*').eq('key', key).single()

    if (error) throw error

    return data
  },
}
