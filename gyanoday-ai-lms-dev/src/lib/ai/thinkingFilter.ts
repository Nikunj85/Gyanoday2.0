/**
 * The Socratic tutor's system prompt requires the model to structure every
 * reply as:
 *
 *   <internal_thought> ...private reasoning, never shown to the student... </internal_thought>
 *   <student_facing_response> ...the actual reply, streamed live... </student_facing_response>
 *
 * This is a strict ALLOWLIST filter — the opposite of a denylist. Nothing
 * reaches the student unless it is inside a well-formed
 * <student_facing_response> block. That includes the <internal_thought>
 * block itself, and also any stray preamble/postamble text the model might
 * emit outside both tags (which a denylist-style "strip this one tag"
 * approach would accidentally leak).
 */

const RESPONSE_OPEN = '<student_facing_response>'
const RESPONSE_CLOSE = '</student_facing_response>'
const THOUGHT_OPEN = '<internal_thought>'
const THOUGHT_CLOSE = '</internal_thought>'

function longestPartialTagSuffix(text: string, tag: string): string {
  const maxLen = Math.min(text.length, tag.length - 1)
  for (let len = maxLen; len > 0; len--) {
    if (text.endsWith(tag.slice(0, len))) return text.slice(text.length - len)
  }
  return ''
}

/**
 * Streaming filter. Wraps a raw token stream from the model and yields
 * ONLY the content inside <student_facing_response>...</student_facing_response>,
 * live, as it arrives.
 */
export async function* filterHiddenReasoning(
  source: AsyncGenerator<string>
): AsyncGenerator<string> {
  let buffer = ''
  let state: 'before-response' | 'inside-response' | 'done' = 'before-response'
  let sawResponseOpenTag = false
  let fullRawText = ''

  for await (const rawChunk of source) {
    fullRawText += rawChunk
    buffer += rawChunk

    // eslint-disable-next-line no-constant-condition
    while (true) {
      if (state === 'done') break

      if (state === 'inside-response') {
        const closeIdx = buffer.indexOf(RESPONSE_CLOSE)
        if (closeIdx === -1) {
          // Still streaming the student-facing reply — yield everything
          // safe (i.e. not a partial closing tag) as it arrives, live.
          const holdBack = longestPartialTagSuffix(buffer, RESPONSE_CLOSE)
          const safeToYield = buffer.slice(0, buffer.length - holdBack.length)
          if (safeToYield) yield safeToYield
          buffer = holdBack
          break
        }
        const safeToYield = buffer.slice(0, closeIdx)
        if (safeToYield) yield safeToYield
        buffer = ''
        state = 'done'
        break
      }

      // state === 'before-response': everything here is either the hidden
      // <internal_thought> block or stray text — never forwarded. We're
      // only scanning for where <student_facing_response> begins.
      const openIdx = buffer.indexOf(RESPONSE_OPEN)
      if (openIdx === -1) {
        // Keep only enough of the buffer to detect a split tag next chunk;
        // everything else in "before" state is discarded, not yielded.
        buffer = longestPartialTagSuffix(buffer, RESPONSE_OPEN)
        break
      }
      sawResponseOpenTag = true
      buffer = buffer.slice(openIdx + RESPONSE_OPEN.length)
      state = 'inside-response'
      // loop again — the remainder of buffer may already contain reply text
    }

    if (state === 'done') break
  }

  if (!sawResponseOpenTag) {
    // Fully malformed output — the model never produced the expected tag
    // at all. Rather than show the student a permanently blank bubble
    // (which is worse than a formatting slip), fall back to the raw text
    // with any complete <internal_thought> block stripped out. Private
    // reasoning is still never shown; only the "guaranteed live streaming
    // of a perfectly-tagged reply" guarantee is relaxed, for this edge
    // case only.
    yield stripInternalThought(fullRawText)
  }
}

function stripInternalThought(text: string): string {
  const openIdx = text.indexOf(THOUGHT_OPEN)
  if (openIdx === -1) return text.trim()
  const closeIdx = text.indexOf(THOUGHT_CLOSE, openIdx)
  if (closeIdx === -1) return text.slice(0, openIdx).trim()
  return (text.slice(0, openIdx) + text.slice(closeIdx + THOUGHT_CLOSE.length)).trim()
}

/**
 * Non-streaming variant, same allowlist logic, used as a safety net on any
 * non-streaming chatbot code path.
 */
export function stripHiddenReasoning(fullText: string): string {
  const openIdx = fullText.indexOf(RESPONSE_OPEN)
  if (openIdx === -1) return stripInternalThought(fullText)

  const afterOpen = fullText.slice(openIdx + RESPONSE_OPEN.length)
  const closeIdx = afterOpen.indexOf(RESPONSE_CLOSE)
  if (closeIdx === -1) return afterOpen.trim()

  return afterOpen.slice(0, closeIdx).trim()
}
