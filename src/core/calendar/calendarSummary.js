/** Texto SUMMARY para eventos de recordatorio en Calendario nativo. */

export const DEFAULT_FRIENDLY_PHRASE = 'Es momento de retomarlo'

const MAX_SUMMARY_LEN = 100

function sanitizeIcsText(value) {
  return (value || '').replace(/[,;\\]/g, ' ').trim()
}

export function resolveFriendlyPhrase(description) {
  const trimmed = sanitizeIcsText(description)
  return trimmed || DEFAULT_FRIENDLY_PHRASE
}

/**
 * @param {{ title?: string, phrase?: string, kind?: 'daily' | 'task' }} opts
 * @returns {string} p.ej. "Syng · Es momento de retomarlo · Comprar leche"
 */
export function buildCalendarSummary({ title, phrase, kind } = {}) {
  const safeTitle = sanitizeIcsText(title || 'Recordatorio')

  if (kind === 'daily') {
    const label = safeTitle.length > 48 ? `${safeTitle.slice(0, 45)}…` : safeTitle
    return `Syng · ${label}`
  }

  const friendly = resolveFriendlyPhrase(phrase)
  const prefix = `Syng · ${friendly} · `
  let task = safeTitle

  const maxTaskLen = MAX_SUMMARY_LEN - prefix.length
  if (maxTaskLen > 8 && task.length > maxTaskLen) {
    task = `${task.slice(0, maxTaskLen - 1)}…`
  } else if (maxTaskLen <= 8) {
    const full = `${prefix}${task}`
    return full.length > MAX_SUMMARY_LEN ? `${full.slice(0, MAX_SUMMARY_LEN - 1)}…` : full
  }

  return `${prefix}${task}`
}
