import 'server-only'

export interface NineRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface NineRouterOptions {
  temperature?: number
  maxTokens?: number
  timeoutMs?: number
}

export interface NineRouterConfig {
  baseUrl: string
  apiKey: string
  model: string
  isConfigured: boolean
}

/**
 * Reads provider configuration safely from server-only environment variables.
 * Never prints or leaks secrets in return payloads or logs.
 */
export function getNineRouterConfig(): NineRouterConfig {
  const baseUrl = (process.env.NINE_ROUTER_BASE_URL || 'https://router.octalectzz.my.id/v1').replace(/\/+$/, '')
  const apiKey = (process.env.NINE_ROUTER_API_KEY || '').trim()
  const model = (process.env.NINE_ROUTER_MODEL || '').trim()

  return {
    baseUrl,
    apiKey,
    model,
    isConfigured: apiKey.length > 0 && model.length > 0
  }
}

/**
 * Executes an HTTP chat completion request against 9Router's OpenAI-compatible endpoint.
 * Enforces timeout bounds, Bearer authentication, and safe error propagation.
 */
export async function callNineRouterChatCompletion(
  messages: NineRouterMessage[],
  options: NineRouterOptions = {}
): Promise<{ content: string; thinking?: string; model: string }> {
  const config = getNineRouterConfig()

  if (!config.isConfigured) {
    throw new Error('AI_CONFIG_MISSING: Kredensial 9Router belum dikonfigurasi pada server.')
  }

  const endpoint = `${config.baseUrl}/chat/completions`
  const timeoutMs = options.timeoutMs ?? 25000

  const payload = {
    model: config.model,
    messages,
    stream: false,
    temperature: options.temperature ?? 0.2,
    max_tokens: options.maxTokens ?? 1200
  }

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeoutMs)
    })
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      throw new Error('AI_TIMEOUT: Permintaan ke penyedia AI melebihi batas waktu (timeout).')
    }
    const msg = error instanceof Error ? error.message : 'Network error'
    throw new Error(`AI_NETWORK_ERROR: Gagal menghubungi penyedia AI (${msg}).`)
  }

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`
    try {
      const errJson = await response.json()
      if (errJson && typeof errJson === 'object') {
        if (typeof errJson.error === 'string') {
          errorDetail = errJson.error
        } else if (errJson.error && typeof errJson.error.message === 'string') {
          errorDetail = errJson.error.message
        }
      }
    } catch {
      // Ignore JSON parse error on non-OK responses
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(`AI_AUTH_ERROR: Autentikasi penyedia AI ditolak (${errorDetail}).`)
    }
    if (response.status === 429) {
      throw new Error(`AI_RATE_LIMIT: Batas kuota penyedia AI tercapai (${errorDetail}).`)
    }
    throw new Error(`AI_PROVIDER_ERROR: Penyedia AI mengembalikan kesalahan (${errorDetail}).`)
  }

  let data: {
    id?: string
    model?: string
    choices?: Array<{
      index?: number
      message?: {
        role?: string
        content?: string
        reasoning_content?: string
      }
      finish_reason?: string
    }>
  }
  try {
    data = (await response.json()) as typeof data
  } catch {
    throw new Error('AI_PARSE_ERROR: Format respon penyedia AI tidak valid.')
  }

  const rawMsg = data?.choices?.[0]?.message
  const choiceContent = rawMsg?.content
  if (typeof choiceContent !== 'string') {
    throw new Error('AI_EMPTY_RESPONSE: Penyedia AI tidak menghasilkan teks.')
  }

  // Extract thinking / reasoning from <think>...</think>, <thinking>...</thinking>, or message.reasoning_content
  let extractedThinking = rawMsg?.reasoning_content?.trim() || ''
  const thinkMatch = choiceContent.match(/<(?:think|thinking)>([\s\S]*?)<\/(?:think|thinking)>/i)
  if (thinkMatch && thinkMatch[1]) {
    const matchedText = thinkMatch[1].trim()
    extractedThinking = extractedThinking ? `${extractedThinking}\n\n${matchedText}` : matchedText
  }

  // Strip <think>...</think> and <thinking>...</thinking> tags from final text
  const cleanContent = choiceContent.replace(/<(?:think|thinking)>[\s\S]*?<\/(?:think|thinking)>/gi, '').trim()

  return {
    content: cleanContent || choiceContent,
    thinking: extractedThinking || undefined,
    model: data.model || config.model
  }
}
