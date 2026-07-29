import { PromptKeys, PromptVariablesMap } from '../constants/prompt_keys'

export function extractVariables(template: string): string[] {
  const matches = template.match(/{{(.*?)}}/g) || []
  return matches.map((v) => v.replace(/[{}]/g, ''))
}

export function fillPrompt(template: string, values: Record<string, string | undefined>): string {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    if (!values[key]) {
      throw new Error(`Missing variable: ${key}`)
    }
    return values[key]
  })
}

export function buildPrompt<K extends PromptKeys>(
  promptKey: K,
  template: string,
  variables: Record<string, string | undefined>
): string {
  let output = template
  const requiredVars = PromptVariablesMap[promptKey]
  requiredVars.forEach((v) => {
    if (!variables[v]) {
      throw new Error(`Missing variable: ${v}`)
    }
    const regex = new RegExp(`{{${v}}}`, 'g')
    output = output.replace(regex, variables[v])
  })

  return output
}
