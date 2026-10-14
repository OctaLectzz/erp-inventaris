import { describe, expect, it } from 'vitest'

import { categoryInputSchema, categoryUpdateSchema } from '@/schemas/inventory-schema'
import { toCategory } from '@/services/category-service'

describe('Category Schema & Domain Unit Tests', () => {
  describe('categoryInputSchema', () => {
    it('should validate a correct category input', () => {
      const valid = {
        name: 'Elektronik & Gadget',
        slug: 'elektronik-gadget',
        description: 'Perangkat elektronik dan aksesorinya'
      }

      const res = categoryInputSchema.safeParse(valid)
      expect(res.success).toBe(true)
      if (res.success) {
        expect(res.data.name).toBe('Elektronik & Gadget')
        expect(res.data.slug).toBe('elektronik-gadget')
      }
    })

    it('should reject slug with invalid characters or uppercase', () => {
      const invalid = {
        name: 'Elektronik',
        slug: 'Elektronik_Gadget!',
        description: ''
      }

      const res = categoryInputSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })

    it('should reject names shorter than 2 characters', () => {
      const invalid = {
        name: 'A',
        slug: 'a',
        description: ''
      }

      const res = categoryInputSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })

    it('should allow optional description to be null or omitted', () => {
      const valid = {
        name: 'Groceries',
        slug: 'groceries'
      }

      const res = categoryInputSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })
  })

  describe('categoryUpdateSchema', () => {
    it('should validate a correct update payload with valid UUID', () => {
      const valid = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'Home & Living',
        slug: 'home-living',
        description: 'Peralatan rumah tangga'
      }

      const res = categoryUpdateSchema.safeParse(valid)
      expect(res.success).toBe(true)
    })

    it('should reject invalid UUID format in id field', () => {
      const invalid = {
        id: 'invalid-not-a-uuid',
        name: 'Home & Living',
        slug: 'home-living'
      }

      const res = categoryUpdateSchema.safeParse(invalid)
      expect(res.success).toBe(false)
    })
  })

  describe('toCategory Domain Mapper', () => {
    it('should map raw category row with array count correctly', () => {
      const raw = {
        id: 'cat-1',
        name: 'Beauty',
        slug: 'beauty',
        description: 'Skincare products',
        created_at: '2026-10-14T00:00:00Z',
        updated_at: '2026-10-14T00:00:00Z',
        products: [{ count: 12 }]
      }

      const mapped = toCategory(raw)
      expect(mapped.id).toBe('cat-1')
      expect(mapped.name).toBe('Beauty')
      expect(mapped.slug).toBe('beauty')
      expect(mapped.productCount).toBe(12)
    })

    it('should map raw category row with object count correctly', () => {
      const raw = {
        id: 'cat-2',
        name: 'Furniture',
        slug: 'furniture',
        description: null,
        created_at: '2026-10-14T00:00:00Z',
        updated_at: '2026-10-14T00:00:00Z',
        products: { count: 8 }
      }

      const mapped = toCategory(raw)
      expect(mapped.productCount).toBe(8)
      expect(mapped.description).toBeNull()
    })

    it('should default productCount to 0 when products relation is missing', () => {
      const raw = {
        id: 'cat-3',
        name: 'Empty Category',
        slug: 'empty-category',
        description: null,
        created_at: '2026-10-14T00:00:00Z',
        updated_at: '2026-10-14T00:00:00Z'
      }

      const mapped = toCategory(raw)
      expect(mapped.productCount).toBe(0)
    })
  })
})
