/**
 * Converts raw errors (Supabase/Postgres errors, fetch/network failures,
 * OpenAI SDK errors, plain JS errors) into short, friendly, student-
 * appropriate messages — never leaking stack traces, SQL text, status
 * codes, or internal service names to the UI.
 *
 * Usage: `catch (err) { setError(getFriendlyErrorMessage(err)) }`
 */

interface ErrorLike {
  message?: string
  code?: string | number
  status?: number
  statusCode?: number
  name?: string
}

const NETWORK_ERROR_MESSAGE =
  "Looks like your connection dropped. Check your internet and try again."

const GENERIC_ERROR_MESSAGE = "Something went wrong on our end. Please try again in a moment."

const RATE_LIMIT_MESSAGE =
  "You're going a little fast! Give it a few seconds and try again."

const AUTH_ERROR_MESSAGE = "Your session's expired — please log in again to continue."

const NOT_FOUND_MESSAGE = "We couldn't find what you were looking for. It may have been moved or removed."

/** Postgres/PostgREST error codes worth a specific, friendly message. */
const PG_CODE_MESSAGES: Record<string, string> = {
  '23505': "That already exists — try a different one.", // unique_violation
  '23503': "That can't be done right now because something it depends on is missing.", // foreign_key_violation
  '42501': "You don't have permission to do that.", // insufficient_privilege
  PGRST116: "We couldn't find that — it may not exist yet.", // 0 rows on .single()
}

export function getFriendlyErrorMessage(error: unknown): string {
  if (!error) return GENERIC_ERROR_MESSAGE

  const err = error as ErrorLike
  const rawMessage = (err.message || '').toLowerCase()
  const code = err.code != null ? String(err.code) : undefined
  const status = err.status ?? err.statusCode

  // Known Postgres/Supabase error codes
  if (code && PG_CODE_MESSAGES[code]) {
    return PG_CODE_MESSAGES[code]
  }

  // Network-level failures (fetch throws a TypeError with these messages
  // when the request never reaches the server at all)
  if (
    err.name === 'TypeError' &&
    (rawMessage.includes('fetch') || rawMessage.includes('network'))
  ) {
    return NETWORK_ERROR_MESSAGE
  }
  if (rawMessage.includes('failed to fetch') || rawMessage.includes('networkerror')) {
    return NETWORK_ERROR_MESSAGE
  }

  // HTTP status-based
  if (status === 401 || status === 403 || rawMessage.includes('unauthorized')) {
    return AUTH_ERROR_MESSAGE
  }
  if (status === 404) {
    return NOT_FOUND_MESSAGE
  }
  if (status === 429 || rawMessage.includes('rate limit') || rawMessage.includes('quota')) {
    return RATE_LIMIT_MESSAGE
  }
  if (status && status >= 500) {
    return GENERIC_ERROR_MESSAGE
  }

  // OpenAI-specific
  if (rawMessage.includes('openai') || rawMessage.includes('vector store')) {
    return "Our AI tutor is having a moment — please try again in a few seconds."
  }

  // If the thrown error already has a short, clearly human-written message
  // (not a stack trace, not raw JSON, not a Postgres/SQL fragment), it's
  // usually safe to show as-is — this covers deliberate `throw new
  // Error('friendly text')` calls elsewhere in the app.
  const looksHumanWritten =
    !!err.message &&
    err.message.length < 160 &&
    !err.message.includes('{') &&
    !err.message.includes('at ') && // stack trace fragment
    !/^[A-Z_]+$/.test(err.message) // not a bare error code

  if (looksHumanWritten) {
    return err.message!
  }

  return GENERIC_ERROR_MESSAGE
}
