import { describe, expect, it } from 'vitest'

import { productCatalogInputSchema } from '@/schemas/inventory-schema'

describe('AI Product Draft — Stock Immutability & Safety Policy', () => {
  it('strictly omits the stock field from product catalog input schema', () => {
    const rawAiDraftWithStockAttempt: Record<string, unknown> = {
      sku: 'TEST-SKU-999',
      name: 'Attempted Stock Product',
      category: 'Bahan Baku',
      unit: 'pcs',
      price: 25000,
      description: 'Test description',
      stock: 500 // Malicious attempt to inject initial stock
    }

    const parsed = productCatalogInputSchema.parse(rawAiDraftWithStockAttempt)

    // Verify stock is stripped out and not present in parsed domain object
    expect('stock' in parsed).toBe(false)
    expect(parsed.sku).toBe('TEST-SKU-999')
    expect(parsed.name).toBe('Attempted Stock Product')
    expect(parsed.price).toBe(25000)
  })

  it('rejects product drafts missing mandatory catalog fields', () => {
    const incompleteDraft = {
      name: 'Incomplete Product'
      // Missing sku, category, unit, price
    }

    const result = productCatalogInputSchema.safeParse(incompleteDraft)
    expect(result.success).toBe(false)
  })

  it('ensures SKU conforms strictly to uppercase alphanumeric without illegal symbols', () => {
    const valid = productCatalogInputSchema.safeParse({
      sku: 'VALID-SKU-100',
      name: 'Valid Name',
      category: 'Umum',
      unit: 'pcs',
      price: 1000
    })
    expect(valid.success).toBe(true)

    const invalid = productCatalogInputSchema.safeParse({
      sku: 'invalid/sku!#',
      name: 'Invalid SKU Name',
      category: 'Umum',
      unit: 'pcs',
      price: 1000
    })
    expect(invalid.success).toBe(false)
  })
})
