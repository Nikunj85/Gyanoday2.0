/**
 * Watches a growing JSON text buffer (as it streams in from the model,
 * chunk by chunk) and extracts each element of a named top-level array
 * (e.g. `"questions": [...]`) the instant that element's closing brace
 * arrives — without waiting for the whole array, or the whole JSON object,
 * to finish.
 *
 * This is what lets the UI reveal quiz question 1 while question 2 is
 * still being generated, instead of waiting for all of them.
 *
 * String- and escape-aware, so braces inside question text/options don't
 * confuse the depth counter.
 */
export class IncrementalJsonArrayExtractor {
  private buffer = ''
  private cursor = 0
  private arrayStartIndex = -1 // index of the char right after the array's opening [
  private depth = 0 // brace depth relative to being inside the array (0 = between elements)
  private inString = false
  private escapeNext = false
  private elementStart = -1
  private readonly arrayKeyPattern: RegExp

  constructor(private readonly arrayKey: string) {
    // Matches "questions"\s*:\s*[  (allowing for the streamed whitespace OpenAI emits)
    this.arrayKeyPattern = new RegExp(`"${arrayKey}"\\s*:\\s*\\[`)
  }

  /**
   * Feed the next chunk of streamed text. Returns any array elements that
   * newly became complete as a result of this chunk (usually 0 or 1, but
   * could be more if a chunk happens to close multiple elements at once).
   */
  push(chunk: string): unknown[] {
    this.buffer += chunk
    const newItems: unknown[] = []

    if (this.arrayStartIndex === -1) {
      const match = this.arrayKeyPattern.exec(this.buffer)
      if (!match) return newItems
      this.arrayStartIndex = match.index + match[0].length
      this.cursor = this.arrayStartIndex
    }

    for (; this.cursor < this.buffer.length; this.cursor++) {
      const char = this.buffer[this.cursor]

      if (this.inString) {
        if (this.escapeNext) {
          this.escapeNext = false
        } else if (char === '\\') {
          this.escapeNext = true
        } else if (char === '"') {
          this.inString = false
        }
        continue
      }

      if (char === '"') {
        this.inString = true
        continue
      }

      if (char === '{') {
        if (this.depth === 0) this.elementStart = this.cursor
        this.depth++
        continue
      }

      if (char === '}') {
        this.depth--
        if (this.depth === 0 && this.elementStart !== -1) {
          const raw = this.buffer.slice(this.elementStart, this.cursor + 1)
          try {
            newItems.push(JSON.parse(raw))
          } catch {
            // Shouldn't happen if brace/string tracking is correct, but
            // don't let a parse hiccup crash the whole stream.
          }
          this.elementStart = -1
        }
        continue
      }

      if (char === ']' && this.depth === 0) {
        // Array closed — nothing more to extract.
        this.cursor = this.buffer.length
        break
      }
    }

    return newItems
  }
}
