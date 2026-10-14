'use server'

import { sanitizeAiErrorMessage } from '@/lib/ai/ai-guardrails'
import { getNineRouterConfig } from '@/lib/ai/nine-router-client'
import { createClient } from '@/lib/supabase/server'
import { aiInventoryQuestionRequestSchema, aiProductDraftRequestSchema, aiRefineDescriptionRequestSchema } from '@/schemas/ai-schema'
import { answerInventoryQuestion, generateProductDraft, refineProductDescription } from '@/services/ai-service'
import { requireAuth } from '@/services/auth-service'
import { isAuditorRole, isValidRole } from '@/types/auth'

import type { AiActionResult, AiConfigStatus, AiInventoryAnswer, AiProductDraft, AiRefineResult } from '@/types/ai'

/**
 * Checks whether 9Router AI provider is configured on the server.
 * Never leaks the actual secret key.
 */
export async function getAiConfigStatusAction(): Promise<AiConfigStatus> {
  const config = getNineRouterConfig()
  return {
    isConfigured: config.isConfigured,
    hasModel: config.model.length > 0,
    endpoint: config.baseUrl,
    modelName: config.model || undefined
  }
}

/**
 * Server Action to generate a structured product catalog draft.
 * Permitted for: administrator, staff_gudang, admin_gudang.
 * Denied for: auditor, owner.
 */
export async function generateProductDraftAction(rawInput: unknown, locale = 'id'): Promise<AiActionResult<AiProductDraft>> {
  let userProfile
  try {
    const authContext = await requireAuth(locale)
    userProfile = authContext.profile
  } catch {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: locale === 'en' ? 'Session expired. Please sign in again.' : 'Sesi Anda telah berakhir. Silakan masuk kembali.'
    }
  }

  if (isAuditorRole(userProfile.role)) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message:
        locale === 'en'
          ? 'Auditor role has read-only access and cannot generate product drafts.'
          : 'Peran Auditor hanya memiliki akses baca dan tidak dapat membuat draf produk.'
    }
  }

  const parsed = aiProductDraftRequestSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message:
        locale === 'en'
          ? 'Invalid request. Prompt must be at least 2 characters.'
          : 'Permintaan tidak valid. Masukkan nama produk minimal 2 karakter.'
    }
  }

  try {
    const supabase = await createClient()
    const draft = await generateProductDraft(parsed.data.prompt, parsed.data.categoryHint, locale, userProfile, supabase)
    return { success: true, data: draft }
  } catch (error) {
    return {
      success: false,
      error: 'AI_ERROR',
      message: sanitizeAiErrorMessage(error, locale)
    }
  }
}

/**
 * Server Action to refine product description or extract specifications.
 */
export async function refineProductDescriptionAction(rawInput: unknown, locale = 'id'): Promise<AiActionResult<AiRefineResult>> {
  let userProfile
  try {
    const authContext = await requireAuth(locale)
    userProfile = authContext.profile
  } catch {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: locale === 'en' ? 'Session expired. Please sign in again.' : 'Sesi Anda telah berakhir. Silakan masuk kembali.'
    }
  }

  if (isAuditorRole(userProfile.role)) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message:
        locale === 'en'
          ? 'Auditor role has read-only access and cannot edit product descriptions.'
          : 'Peran Auditor hanya memiliki akses baca dan tidak dapat mengubah deskripsi produk.'
    }
  }

  const parsed = aiRefineDescriptionRequestSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: locale === 'en' ? 'Invalid text. Minimum 3 characters required.' : 'Teks tidak valid. Masukkan minimal 3 karakter.'
    }
  }

  try {
    const result = await refineProductDescription(parsed.data.text, parsed.data.mode, locale, userProfile)
    return { success: true, data: result }
  } catch (error) {
    return {
      success: false,
      error: 'AI_ERROR',
      message: sanitizeAiErrorMessage(error, locale)
    }
  }
}

/**
 * Server Action to answer natural language inventory questions.
 * Permitted for all authenticated roles.
 */
export async function askInventoryQuestionAction(rawInput: unknown, locale = 'id'): Promise<AiActionResult<AiInventoryAnswer>> {
  let userProfile
  try {
    const authContext = await requireAuth(locale)
    userProfile = authContext.profile
  } catch {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: locale === 'en' ? 'Session expired. Please sign in again.' : 'Sesi Anda telah berakhir. Silakan masuk kembali.'
    }
  }

  if (!isValidRole(userProfile.role)) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: locale === 'en' ? 'Invalid user role.' : 'Peran pengguna tidak valid.'
    }
  }

  const parsed = aiInventoryQuestionRequestSchema.safeParse(rawInput)
  if (!parsed.success) {
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: locale === 'en' ? 'Question must be between 3 and 500 characters.' : 'Pertanyaan harus antara 3 hingga 500 karakter.'
    }
  }

  try {
    const supabase = await createClient()
    const answer = await answerInventoryQuestion(parsed.data.question, locale, userProfile, supabase)
    return { success: true, data: answer }
  } catch (error) {
    return {
      success: false,
      error: 'AI_ERROR',
      message: sanitizeAiErrorMessage(error, locale)
    }
  }
}
