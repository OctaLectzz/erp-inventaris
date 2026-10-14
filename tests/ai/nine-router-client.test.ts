import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { callNineRouterChatCompletion, getNineRouterConfig } from '@/lib/ai/nine-router-client'

describe('9Router AI Transport Client', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.restoreAllMocks()
    process.env.NINE_ROUTER_BASE_URL = 'https://router.octalectzz.my.id/v1'
    process.env.NINE_ROUTER_API_KEY = 'test-secret-api-key-9router'
    process.env.NINE_ROUTER_MODEL = 'test-model-4o'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('reads configuration safely and computes isConfigured correctly', () => {
    const config = getNineRouterConfig()
    expect(config.baseUrl).toBe('https://router.octalectzz.my.id/v1')
    expect(config.model).toBe('test-model-4o')
    expect(config.isConfigured).toBe(true)

    // When missing API key
    delete process.env.NINE_ROUTER_API_KEY
    expect(getNineRouterConfig().isConfigured).toBe(false)
  })

  it('sends correct headers, Authorization Bearer, and payload structure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        id: 'chatcmpl-test',
        model: 'test-model-4o',
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: '{"name":"Test Product"}' }
          }
        ]
      })
    })

    vi.stubGlobal('fetch', mockFetch)

    const result = await callNineRouterChatCompletion([{ role: 'user', content: 'Hello' }])

    expect(result.content).toBe('{"name":"Test Product"}')
    expect(result.model).toBe('test-model-4o')

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [url, options] = mockFetch.mock.calls[0]
    expect(url).toBe('https://router.octalectzz.my.id/v1/chat/completions')
    expect(options.method).toBe('POST')
    expect(options.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer test-secret-api-key-9router'
    })

    const body = JSON.parse(options.body)
    expect(body.model).toBe('test-model-4o')
    expect(body.messages).toEqual([{ role: 'user', content: 'Hello' }])
  })

  it('throws AI_CONFIG_MISSING when API key or model is missing without leaking secrets', async () => {
    delete process.env.NINE_ROUTER_API_KEY

    await expect(callNineRouterChatCompletion([{ role: 'user', content: 'Hello' }])).rejects.toThrow('AI_CONFIG_MISSING')
  })

  it('handles timeout error gracefully with AI_TIMEOUT', async () => {
    const timeoutError = new Error('The operation was aborted')
    timeoutError.name = 'TimeoutError'
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(timeoutError))

    await expect(callNineRouterChatCompletion([{ role: 'user', content: 'Hello' }])).rejects.toThrow('AI_TIMEOUT')
  })

  it('handles HTTP 401 / 403 authorization error without leaking tokens', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'API key required for remote API access' })
      })
    )

    try {
      await callNineRouterChatCompletion([{ role: 'user', content: 'Hello' }])
      expect.fail('Should have thrown')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      expect(msg).toContain('AI_AUTH_ERROR')
      expect(msg).not.toContain('test-secret-api-key-9router')
    }
  })

  it('handles HTTP 429 rate limit error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: async () => ({ error: { message: 'Rate limit exceeded' } })
      })
    )

    await expect(callNineRouterChatCompletion([{ role: 'user', content: 'Hello' }])).rejects.toThrow('AI_RATE_LIMIT')
  })

  it('throws AI_EMPTY_RESPONSE when choices are missing or empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ choices: [] })
      })
    )

    await expect(callNineRouterChatCompletion([{ role: 'user', content: 'Hello' }])).rejects.toThrow('AI_EMPTY_RESPONSE')
  })
})
