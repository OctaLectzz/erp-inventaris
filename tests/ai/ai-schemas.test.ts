import { describe, expect, it } from 'vitest'

import {
  aiInventoryQuestionRequestSchema,
  aiProductDraftRequestSchema,
  aiProductDraftResponseSchema,
  aiRefineDescriptionRequestSchema
} from '@/schemas/ai-schema'

describe('AI Zod Schemas Validation', () => {
  describe('aiProductDraftRequestSchema', () => {
    it('accepts valid prompt and category hint', () => {
      const valid = {
        prompt: 'Minyak Nilam Murni 50ml',
        categoryHint: 'Bahan Baku',
        locale: 'id'
      }
      expect(aiProductDraftRequestSchema.safeParse(valid).success).toBe(true)
    })

    it('rejects prompts that are too short (< 2 chars)', () => {
      expect(aiProductDraftRequestSchema.safeParse({ prompt: 'A' }).success).toBe(false)
    })

    it('rejects prompts that exceed 500 characters', () => {
      expect(aiProductDraftRequestSchema.safeParse({ prompt: 'A'.repeat(501) }).success).toBe(false)
    })
  })

  describe('aiProductDraftResponseSchema', () => {
    it('validates a complete, compliant product draft from AI', () => {
      const validDraft = {
        name: 'Minyak Atsiri Nilam 50ml',
        sku: 'OIL-PATCHOULI-50ML',
        category: 'Minyak Atsiri',
        unit: 'botol',
        price: 150000,
        description: 'Minyak atsiri nilam murni kemasan 50ml botol kaca amber.',
        specifications: [
          { key: 'Volume', value: '50ml', isAssumption: false },
          { key: 'Kemasan', value: 'Botol Kaca Amber', isAssumption: true }
        ],
        notes: 'Harga referensi diestimasi berdasarkan standar industri.',
        assumptions: ['Kemasan diasumsikan botol kaca amber']
      }

      const result = aiProductDraftResponseSchema.safeParse(validDraft)
      expect(result.success).toBe(true)
    })

    it('rejects invalid SKU formats (must be uppercase alphanumeric and hyphens only)', () => {
      const invalidSku = {
        name: 'Product Name',
        sku: 'invalid sku with spaces!@#',
        category: 'Umum',
        unit: 'pcs',
        price: 10000
      }
      expect(aiProductDraftResponseSchema.safeParse(invalidSku).success).toBe(false)
    })

    it('rejects negative or fractional prices', () => {
      const negativePrice = {
        name: 'Product Name',
        sku: 'PRD-001',
        category: 'Umum',
        unit: 'pcs',
        price: -500
      }
      expect(aiProductDraftResponseSchema.safeParse(negativePrice).success).toBe(false)

      const floatPrice = {
        name: 'Product Name',
        sku: 'PRD-001',
        category: 'Umum',
        unit: 'pcs',
        price: 12500.5
      }
      expect(aiProductDraftResponseSchema.safeParse(floatPrice).success).toBe(false)
    })

    it('rejects empty product names', () => {
      const emptyName = {
        name: '   ',
        sku: 'PRD-001',
        category: 'Umum',
        unit: 'pcs',
        price: 10000
      }
      expect(aiProductDraftResponseSchema.safeParse(emptyName).success).toBe(false)
    })
  })

  describe('aiRefineDescriptionRequestSchema', () => {
    it('accepts valid refine modes and text', () => {
      const valid = {
        text: 'Deskripsi bahan mentah berkualitas',
        mode: 'expand',
        locale: 'id'
      }
      expect(aiRefineDescriptionRequestSchema.safeParse(valid).success).toBe(true)
    })

    it('rejects invalid refine modes', () => {
      const invalid = {
        text: 'Deskripsi bahan mentah',
        mode: 'unsupported_mode',
        locale: 'id'
      }
      expect(aiRefineDescriptionRequestSchema.safeParse(invalid).success).toBe(false)
    })
  })

  describe('aiInventoryQuestionRequestSchema', () => {
    it('accepts questions between 3 and 500 characters', () => {
      expect(aiInventoryQuestionRequestSchema.safeParse({ question: 'Berapa total stok?' }).success).toBe(true)
      expect(aiInventoryQuestionRequestSchema.safeParse({ question: 'Hi' }).success).toBe(false)
      expect(aiInventoryQuestionRequestSchema.safeParse({ question: 'X'.repeat(501) }).success).toBe(false)
    })
  })
})
