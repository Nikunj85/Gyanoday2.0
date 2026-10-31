/**
 * Normalises AI-written math / chemistry so react-markdown + remark-math + KaTeX (with mhchem)
 * can render it. Pure string functions - safe on client and server.
 *
 * Handles:
 *  - \( ... \)  and  \[ ... \]   delimiters  ->  $ ... $  and  $$ ... $$
 *  - plain-text reactions like  "2H2 + O2 -> 2H2O",  "CaCO3 → CaO + CO2"  ->  $\ce{...}$
 *  - Unicode subscripts / superscripts inside those reactions (H₂O -> H2O)
 */

const SUBSCRIPT_MAP: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
}
const SUPERSCRIPT_MAP: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9',
  '⁺': '+', '⁻': '-',
}

function normalizeUnicodeScripts(text: string): string {
  return text
    .replace(/[₀-₉]/g, (c) => SUBSCRIPT_MAP[c] ?? c)
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g, (m) => {
      const converted = m.split('').map((c) => SUPERSCRIPT_MAP[c] ?? c).join('')
      return `^${converted}`
    })
}

const ARROW = '(?:-->|->|→|⟶|⇌|<=>|⇄|<->)'
// One reacting species: optional coefficient, formula, optional state symbol.
const SPECIES = '(?:\\d+\\s?)?(?:[A-Z][a-z]?\\d*|\\((?:[A-Za-z0-9]+)\\)\\d*)+(?:\\((?:s|l|g|aq)\\))?'
const SIDE = `${SPECIES}(?:\\s*\\+\\s*${SPECIES})*`
const REACTION = new RegExp(`(${SIDE})\\s*(${ARROW})\\s*(${SIDE})`, 'g')

function toMhchemArrow(arrow: string): string {
  if (arrow === '⇌' || arrow === '⇄' || arrow === '<=>' || arrow === '<->') return '<=>'
  return '->'
}

function wrapReactions(text: string): string {
  return text.replace(REACTION, (match, left: string, arrow: string, right: string) => {
    // Guard against ordinary prose like "A -> B": need a digit or two capitals in a formula.
    if (!/\d|[A-Z][a-z]?[A-Z]/.test(left + ' ' + right)) return match
    return `$\\ce{${left.trim()} ${toMhchemArrow(arrow)} ${right.trim()}}$`
  })
}

/** Convert one non-code, non-math chunk. */
function convertPlainSegment(segment: string): string {
  let out = segment
  // LaTeX-style delimiters some models emit.
  out = out.replace(/\\\[([\s\S]+?)\\\]/g, (_m, inner: string) => `\n$$${inner.trim()}$$\n`)
  out = out.replace(/\\\(([\s\S]+?)\\\)/g, (_m, inner: string) => `$${inner.trim()}$`)
  return out
}

export function normalizeMathMarkdown(content: string): string {
  if (!content) return content

  // Never touch fenced code blocks.
  const parts = content.split(/(```[\s\S]*?```)/g)

  return parts
    .map((part, index) => {
      if (index % 2 === 1) return part // fenced code

      // Convert \( \) / \[ \] first so they become real math, then protect all math spans.
      const delimited = convertPlainSegment(part)
      const pieces = delimited.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]+\$)/g)

      return pieces
        .map((piece, i) => {
          if (i % 2 === 1) return piece // existing math (already $...$ / $$...$$)
          return wrapReactions(normalizeUnicodeScripts(piece))
        })
        .join('')
    })
    .join('')
}
