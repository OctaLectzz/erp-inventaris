import { beforeEach, describe, expect, it, vi } from 'vitest'

import { askInventoryQuestionAction, generateProductDraftAction, refineProductDescriptionAction } from '@/app/actions/ai-actions'
import * as authService from '@/services/auth-service'

import type { UserProfile, UserRole } from '@/types/auth'
import type { User } from '@supabase/supabase-js'

vi.mock('@/services/auth-service', () => ({
  requireAuth: vi.fn()
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({})
}))

vi.mock('@/services/ai-service', () => ({
  generateProductDraft: vi.fn().mockResolvedValue({
    name: 'Draft Mock',
    sku: 'DFT-001',
    category: 'Umum',
    unit: 'pcs',
    price: 10000,
    description: 'Mock',
    specifications: [],
    notes: '',
    assumptions: []
  }),
  refineProductDescription: vi.fn().mockResolvedValue({
    original: 'Mock',
    refined: 'Refined Mock',
    mode: 'expand'
  }),
  answerInventoryQuestion: vi.fn().mockResolvedValue({
    question: 'Berapa stok?',
    answer: 'Total stok ada 100 unit.',
    contextSummary: 'Summary',
    sources: ['products']
  })
}))

function makeAuthContext(role: UserRole) {
  return {
    user: { id: `${role}-id`, email: `${role}@demo.com` } as unknown as User,
    profile: {
      id: `${role}-id`,
      role,
      email: `${role}@demo.com`,
      fullName: `User ${role}`,
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01'
    } as UserProfile
  }
}

describe('AI Assistant RBAC Server Action Gates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateProductDraftAction', () => {
    it('permits administrator to generate product draft', async () => {
      vi.mocked(authService.requireAuth).mockResolvedValueOnce(makeAuthContext('administrator'))

      const res = await generateProductDraftAction({ prompt: 'Produk Baru' })
      expect(res.success).toBe(true)
    })

    it('permits staff_gudang to generate product draft', async () => {
      vi.mocked(authService.requireAuth).mockResolvedValueOnce(makeAuthContext('staff_gudang'))

      const res = await generateProductDraftAction({ prompt: 'Produk Baru' })
      expect(res.success).toBe(true)
    })

    it('rejects auditor with FORBIDDEN error for product draft generation', async () => {
      vi.mocked(authService.requireAuth).mockResolvedValueOnce(makeAuthContext('auditor'))

      const res = await generateProductDraftAction({ prompt: 'Produk Baru' })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toBe('FORBIDDEN')
      }
    })

    it('rejects unauthenticated requests with UNAUTHORIZED', async () => {
      vi.mocked(authService.requireAuth).mockRejectedValueOnce(new Error('Redirecting to /login'))

      const res = await generateProductDraftAction({ prompt: 'Produk Baru' })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toBe('UNAUTHORIZED')
      }
    })
  })

  describe('refineProductDescriptionAction', () => {
    it('permits staff_gudang to refine product description', async () => {
      vi.mocked(authService.requireAuth).mockResolvedValueOnce(makeAuthContext('staff_gudang'))

      const res = await refineProductDescriptionAction({ text: 'Minyak wangi murni', mode: 'expand' })
      expect(res.success).toBe(true)
    })

    it('rejects auditor for description refinement', async () => {
      vi.mocked(authService.requireAuth).mockResolvedValueOnce(makeAuthContext('auditor'))

      const res = await refineProductDescriptionAction({ text: 'Minyak wangi murni', mode: 'expand' })
      expect(res.success).toBe(false)
      if (!res.success) {
        expect(res.error).toBe('FORBIDDEN')
      }
    })
  })

  describe('askInventoryQuestionAction', () => {
    it('permits auditor to ask inventory questions in read-only mode', async () => {
      vi.mocked(authService.requireAuth).mockResolvedValueOnce(makeAuthContext('auditor'))

      const res = await askInventoryQuestionAction({ question: 'Berapa stok menipis?' })
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.answer).toBe('Total stok ada 100 unit.')
      }
    })

    it('permits staff_gudang to ask inventory questions', async () => {
      vi.mocked(authService.requireAuth).mockResolvedValueOnce(makeAuthContext('staff_gudang'))

      const res = await askInventoryQuestionAction({ question: 'Berapa stok menipis?' })
      expect(res.success).toBe(true)
    })
  })
})
