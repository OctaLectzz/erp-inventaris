import 'server-only'

interface RateLimitRecord {
  timestamps: number[]
}

const userRateLimits = new Map<string, RateLimitRecord>()
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10

/**
 * Enforces per-user sliding window rate limiting in-memory without external dependencies.
 */
export function checkAiRateLimit(userId: string): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now()
  let record = userRateLimits.get(userId)

  if (!record) {
    record = { timestamps: [] }
    userRateLimits.set(userId, record)
  }

  // Filter timestamps within the rolling window
  record.timestamps = record.timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS)

  if (record.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    const oldest = record.timestamps[0]
    const retryAfter = Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000)
    return { allowed: false, retryAfterSeconds: Math.max(1, retryAfter) }
  }

  record.timestamps.push(now)
  return { allowed: true }
}

/**
 * Resets rate limit records for testing purposes.
 */
export function resetRateLimitsForTesting(): void {
  userRateLimits.clear()
}

/**
 * Sanitizes user input string:
 * - Trims and removes control characters (except newline and tab)
 * - Escapes potential prompt injection delimiter tokens
 * - Enforces character limit
 */
export function sanitizePrompt(input: string, maxLength = 500): string {
  if (!input || typeof input !== 'string') return ''

  // Strip control characters except newline and tab
  const cleaned = input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/<<</g, '&lt;&lt;&lt;')
    .replace(/>>>/g, '&gt;&gt;&gt;')
    .trim()

  return cleaned.slice(0, maxLength)
}

/**
 * Safely extracts JSON block from raw model output, handling optional markdown code fences.
 */
export function extractJsonFromResponse(raw: string): string {
  const trimmed = raw.trim()

  // Match ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (fenceMatch && fenceMatch[1]) {
    return fenceMatch[1].trim()
  }

  // Look for first '{' and last '}'
  const startIdx = trimmed.indexOf('{')
  const endIdx = trimmed.lastIndexOf('}')
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return trimmed.slice(startIdx, endIdx + 1)
  }

  return trimmed
}

/**
 * Maps internal errors to clean, safe, localized messages without stack traces or secrets.
 */
export function sanitizeAiErrorMessage(error: unknown, locale = 'id'): string {
  const msg = error instanceof Error ? error.message : String(error)

  if (msg.startsWith('AI_CONFIG_MISSING')) {
    return locale === 'en'
      ? 'AI provider is not configured. Please contact the system administrator.'
      : 'Layanan AI belum dikonfigurasi. Hubungi administrator sistem.'
  }
  if (msg.startsWith('AI_TIMEOUT')) {
    return locale === 'en'
      ? 'The AI request timed out. Please try again with a shorter prompt.'
      : 'Permintaan AI melebihi batas waktu. Coba kembali dengan pertanyaan yang lebih singkat.'
  }
  if (msg.startsWith('AI_AUTH_ERROR')) {
    return locale === 'en'
      ? 'AI provider authentication failed. Please verify credentials.'
      : 'Autentikasi penyedia AI gagal. Periksa kembali token otorisasi server.'
  }
  if (msg.startsWith('AI_RATE_LIMIT')) {
    return locale === 'en'
      ? 'Too many requests. Please wait a moment before trying again.'
      : 'Terlalu banyak permintaan. Mohon tunggu beberapa saat sebelum mencoba kembali.'
  }

  return locale === 'en' ? 'An error occurred while processing the AI request.' : 'Terjadi kesalahan saat memproses permintaan asisten AI.'
}
