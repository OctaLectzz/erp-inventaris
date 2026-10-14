import { describe, expect, it } from 'vitest'

import { batchStockMutationSchema } from '@/schemas/inventory-schema'

describe('batchStockMutationSchema Validation', () => {
  const validUuid1 = '11111111-1111-4111-8111-111111111111'
  const validUuid2 = '22222222-2222-4222-8222-222222222222'

  it('accepts a valid batch transaction input', () => {
    const input = {
      type: 'IN' as const,
      note: 'Supplier receiving batch PO-101',
      items: [
        { productId: validUuid1, quantity: 10 },
        { productId: validUuid2, quantity: 25 }
      ]
    }

    const result = batchStockMutationSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects empty items array', () => {
    const input = {
      type: 'OUT' as const,
      note: 'Branch delivery batch',
      items: []
    }

    const result = batchStockMutationSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects invalid UUID in items', () => {
    const input = {
      type: 'IN' as const,
      note: 'Valid note for delivery',
      items: [{ productId: 'not-a-uuid', quantity: 5 }]
    }

    const result = batchStockMutationSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects zero or negative quantities', () => {
    const inputZero = {
      type: 'IN' as const,
      note: 'Valid note for delivery',
      items: [{ productId: validUuid1, quantity: 0 }]
    }
    expect(batchStockMutationSchema.safeParse(inputZero).success).toBe(false)

    const inputNegative = {
      type: 'IN' as const,
      note: 'Valid note for delivery',
      items: [{ productId: validUuid1, quantity: -10 }]
    }
    expect(batchStockMutationSchema.safeParse(inputNegative).success).toBe(false)
  })

  it('rejects floating point quantities', () => {
    const inputFloat = {
      type: 'IN' as const,
      note: 'Valid note for delivery',
      items: [{ productId: validUuid1, quantity: 3.5 }]
    }
    expect(batchStockMutationSchema.safeParse(inputFloat).success).toBe(false)
  })

  it('rejects duplicate product IDs in a single transaction', () => {
    const inputDuplicate = {
      type: 'IN' as const,
      note: 'Receiving with duplicate items',
      items: [
        { productId: validUuid1, quantity: 10 },
        { productId: validUuid1, quantity: 20 }
      ]
    }

    const result = batchStockMutationSchema.safeParse(inputDuplicate)
    expect(result.success).toBe(false)
  })

  it('rejects short notes (< 3 chars) or empty whitespace', () => {
    const inputShortNote = {
      type: 'IN' as const,
      note: '  ab  ',
      items: [{ productId: validUuid1, quantity: 10 }]
    }
    expect(batchStockMutationSchema.safeParse(inputShortNote).success).toBe(false)
  })
})
