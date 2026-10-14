import 'server-only'

import { checkAiRateLimit, extractJsonFromResponse, sanitizePrompt } from '@/lib/ai/ai-guardrails'
import { buildDescriptionRefineMessages, buildInventoryQaMessages, buildProductDraftMessages } from '@/lib/ai/ai-prompts'
import { callNineRouterChatCompletion } from '@/lib/ai/nine-router-client'
import { aiProductDraftResponseSchema } from '@/schemas/ai-schema'
import { getCatalogCategories, getInventoryDashboardData } from '@/services/product-service'

import type { AiInventoryAnswer, AiProductDraft, AiRefineMode, AiRefineResult } from '@/types/ai'
import type { UserProfile } from '@/types/auth'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Builds a compact, factual text summary of inventory status (< 1KB) for grounded AI Q&A.
 */
export async function getInventoryAiContext(supabase: SupabaseClient<Database>): Promise<string> {
  const [dashboardData, categories] = await Promise.all([getInventoryDashboardData(supabase), getCatalogCategories(supabase)])

  const { summary, lowStockProducts, totalCount } = dashboardData

  const lowStockList =
    lowStockProducts.length > 0
      ? lowStockProducts
          .slice(0, 10)
          .map((p) => `- ${p.name} (SKU: ${p.sku}, Stok: ${p.stock} ${p.unit}, Kategori: ${p.category})`)
          .join('\n')
      : 'Tidak ada produk di bawah batas minimum stok (semua aman).'

  return `RINGKASAN GUDANG INVENTRA:
- Total Produk Terdaftar: ${totalCount} SKU
- Total Unit Fisik di Gudang: ${summary.totalUnits.toLocaleString('id-ID')} unit
- Jumlah Item Low Stock (< 5 unit): ${summary.lowStockCount} item
- Estimasi Valuasi Nilai Stok: Rp ${summary.totalInventoryValue.toLocaleString('id-ID')}
- Kategori Aktif: ${categories.join(', ') || 'Belum ada kategori'}

DAFTAR ITEM LOW STOCK TERATAS:
${lowStockList}`
}

/**
 * Generates an editable product catalog draft from user input.
 */
export async function generateProductDraft(
  prompt: string,
  categoryHint: string | undefined,
  locale: string,
  userProfile: UserProfile,
  supabase: SupabaseClient<Database>
): Promise<AiProductDraft> {
  const rateLimit = checkAiRateLimit(userProfile.id)
  if (!rateLimit.allowed) {
    throw new Error(`AI_RATE_LIMIT: Silakan tunggu ${rateLimit.retryAfterSeconds} detik.`)
  }

  const sanitizedPrompt = sanitizePrompt(prompt, 500)
  const existingCategories = await getCatalogCategories(supabase).catch(() => [])

  const messages = buildProductDraftMessages({
    sanitizedPrompt,
    categoryHint,
    existingCategories,
    locale
  })

  const { content } = await callNineRouterChatCompletion(messages, {
    temperature: 0.1,
    maxTokens: 1200
  })

  const jsonString = extractJsonFromResponse(content)
  let rawParsed: unknown
  try {
    rawParsed = JSON.parse(jsonString)
  } catch {
    throw new Error('AI_PARSE_ERROR: Format respon AI bukan JSON yang valid.')
  }

  // Pre-normalize SKU to uppercase alphanumeric
  if (rawParsed && typeof rawParsed === 'object' && 'sku' in rawParsed) {
    const obj = rawParsed as Record<string, unknown>
    if (typeof obj.sku === 'string') {
      obj.sku = obj.sku.toUpperCase().replace(/[^A-Z0-9-]/g, '')
    }
  }

  const validated = aiProductDraftResponseSchema.safeParse(rawParsed)
  if (!validated.success) {
    throw new Error('AI_SCHEMA_ERROR: Struktur draf yang dihasilkan tidak sesuai dengan skema katalog.')
  }

  return validated.data
}

/**
 * Refines, shortens, translates, or extracts specifications for product descriptions.
 */
export async function refineProductDescription(text: string, mode: AiRefineMode, locale: string, userProfile: UserProfile): Promise<AiRefineResult> {
  const rateLimit = checkAiRateLimit(userProfile.id)
  if (!rateLimit.allowed) {
    throw new Error(`AI_RATE_LIMIT: Silakan tunggu ${rateLimit.retryAfterSeconds} detik.`)
  }

  const sanitizedText = sanitizePrompt(text, 2000)
  const messages = buildDescriptionRefineMessages({
    sanitizedText,
    mode,
    locale
  })

  const { content } = await callNineRouterChatCompletion(messages, {
    temperature: 0.2,
    maxTokens: 800
  })

  return {
    original: sanitizedText,
    refined: content.trim(),
    mode
  }
}

/**
 * Answers natural language inventory questions using strict, read-only factual context.
 */
export async function answerInventoryQuestion(
  question: string,
  locale: string,
  userProfile: UserProfile,
  supabase: SupabaseClient<Database>
): Promise<AiInventoryAnswer> {
  const rateLimit = checkAiRateLimit(userProfile.id)
  if (!rateLimit.allowed) {
    throw new Error(`AI_RATE_LIMIT: Silakan tunggu ${rateLimit.retryAfterSeconds} detik.`)
  }

  const sanitizedQuestion = sanitizePrompt(question, 500)
  const inventoryContext = await getInventoryAiContext(supabase)

  const messages = buildInventoryQaMessages({
    sanitizedQuestion,
    inventoryContext,
    locale
  })

  const { content } = await callNineRouterChatCompletion(messages, {
    temperature: 0.1,
    maxTokens: 1000
  })

  return {
    question: sanitizedQuestion,
    answer: content.trim(),
    contextSummary: 'Ringkasan KPI gudang, kategori terdaftar, dan 10 produk low stock teratas.',
    sources: ['Katalog Produk (public.products)', 'Kategori (public.categories)']
  }
}
