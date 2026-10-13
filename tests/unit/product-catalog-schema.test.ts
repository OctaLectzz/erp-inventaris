import { describe, expect, it } from 'vitest'

import { productCatalogInputSchema, productCatalogUpdateSchema } from '@/schemas/inventory-schema'

describe('Product Catalog Schemas & Stock Immutability Unit Tests', () => {
  describe('productCatalogInputSchema', () => {
    it('should validate a complete, valid catalog product input', () => {
      const validPayload = {
        sku: 'PROD-LAPTOP-01',
        name: 'Ergonomic Laptop Stand',
        category: 'accessories',
        unit: 'pcs',
        price: 350_000,
        description: 'Premium aluminium laptop stand',
        imageUrl: 'https://example.com/images/stand.jpg'
      }

      const parsed = productCatalogInputSchema.safeParse(validPayload)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(parsed.data.sku).toBe('PROD-LAPTOP-01')
        expect(parsed.data.price).toBe(350_000)
        expect(parsed.data.unit).toBe('pcs')
      }
    })

    it('should accept empty or null optional fields (description and imageUrl)', () => {
      const minimalPayload = {
        sku: 'SKU-MINIMAL-01',
        name: 'Basic Item',
        category: 'general',
        unit: 'box',
        price: 25_000,
        description: null,
        imageUrl: ''
      }

      const parsed = productCatalogInputSchema.safeParse(minimalPayload)
      expect(parsed.success).toBe(true)
    })

    it('should strip out any injected stock field from parsed data (Stock Immutability)', () => {
      const payloadWithInjectedStock = {
        sku: 'HACK-STOCK-01',
        name: 'Injected Stock Attempt',
        category: 'security',
        unit: 'pcs',
        price: 100_000,
        stock: 99999 // Attacker tries to inject stock into catalog input!
      }

      const parsed = productCatalogInputSchema.safeParse(payloadWithInjectedStock)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        // Invariant: stock field is NOT recognized or present in the parsed output
        expect((parsed.data as Record<string, unknown>).stock).toBeUndefined()
        expect(Object.keys(parsed.data)).not.toContain('stock')
      }
    })

    it('should reject invalid SKU formats (lowercase, spaces, special symbols)', () => {
      const testCases = [
        { sku: 'ab', error: 'skuTooShort' }, // length < 3
        { sku: 'sku-lowercase', error: 'skuInvalidFormat' }, // lowercase
        { sku: 'SKU WITH SPACES', error: 'skuInvalidFormat' }, // spaces
        { sku: 'SKU@SPECIAL#', error: 'skuInvalidFormat' }, // special characters
        { sku: 'A'.repeat(51), error: 'skuTooLong' } // length > 50
      ]

      for (const tc of testCases) {
        const parsed = productCatalogInputSchema.safeParse({
          sku: tc.sku,
          name: 'Test',
          category: 'cat',
          unit: 'pcs',
          price: 10_000
        })
        expect(parsed.success).toBe(false)
        if (!parsed.success) {
          expect(parsed.error.issues[0]?.message).toBe(tc.error)
        }
      }
    })

    it('should reject empty name, category, or unit', () => {
      expect(
        productCatalogInputSchema.safeParse({
          sku: 'SKU-001',
          name: '   ',
          category: 'cat',
          unit: 'pcs',
          price: 10_000
        }).success
      ).toBe(false)

      expect(
        productCatalogInputSchema.safeParse({
          sku: 'SKU-001',
          name: 'Valid Name',
          category: '',
          unit: 'pcs',
          price: 10_000
        }).success
      ).toBe(false)

      expect(
        productCatalogInputSchema.safeParse({
          sku: 'SKU-001',
          name: 'Valid Name',
          category: 'cat',
          unit: '  ',
          price: 10_000
        }).success
      ).toBe(false)
    })

    it('should reject negative or fractional prices', () => {
      const negativeParsed = productCatalogInputSchema.safeParse({
        sku: 'SKU-001',
        name: 'Test',
        category: 'cat',
        unit: 'pcs',
        price: -500
      })
      expect(negativeParsed.success).toBe(false)

      const fractionalParsed = productCatalogInputSchema.safeParse({
        sku: 'SKU-001',
        name: 'Test',
        category: 'cat',
        unit: 'pcs',
        price: 15.75
      })
      expect(fractionalParsed.success).toBe(false)
    })

    it('should reject invalid image URLs', () => {
      const invalidUrl = productCatalogInputSchema.safeParse({
        sku: 'SKU-001',
        name: 'Test',
        category: 'cat',
        unit: 'pcs',
        price: 10_000,
        imageUrl: 'not-a-valid-url'
      })
      expect(invalidUrl.success).toBe(false)
    })
  })

  describe('productCatalogUpdateSchema', () => {
    it('should require a valid UUID product id', () => {
      const validUpdate = {
        id: 'edca6478-3197-4f48-ab94-6bd81d233a26',
        sku: 'PROD-UPDATE-01',
        name: 'Updated Name',
        category: 'electronics',
        unit: 'pcs',
        price: 500_000
      }
      expect(productCatalogUpdateSchema.safeParse(validUpdate).success).toBe(true)

      const invalidId = {
        ...validUpdate,
        id: 'invalid-non-uuid'
      }
      expect(productCatalogUpdateSchema.safeParse(invalidId).success).toBe(false)
    })

    it('should guarantee that update schema omits the stock field', () => {
      const updateWithStock = {
        id: 'edca6478-3197-4f48-ab94-6bd81d233a26',
        sku: 'PROD-UPDATE-01',
        name: 'Updated Name',
        category: 'electronics',
        unit: 'pcs',
        price: 500_000,
        stock: 50 // Injected stock attempt on update
      }

      const parsed = productCatalogUpdateSchema.safeParse(updateWithStock)
      expect(parsed.success).toBe(true)
      if (parsed.success) {
        expect(Object.keys(parsed.data)).not.toContain('stock')
      }
    })
  })
})
