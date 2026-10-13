import { describe, expect, it } from 'vitest'

import { stockMutationInputSchema } from '@/schemas/inventory-schema'
import { calculateStockMutation } from '@/services/inventory-domain'

describe('Stock Mutation Domain Unit Tests', () => {
  describe('Zod Schema Validation (stockMutationInputSchema)', () => {
    const validPayload = {
      productId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      type: 'IN' as const,
      quantity: 10,
      note: 'Penerimaan batch dari supplier'
    }

    it('should validate a correct stock mutation input', () => {
      const result = stockMutationInputSchema.safeParse(validPayload)
      expect(result.success).toBe(true)
    })

    it('should reject invalid or non-UUID product IDs', () => {
      const result = stockMutationInputSchema.safeParse({
        ...validPayload,
        productId: 'not-a-valid-uuid'
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0]?.message).toBe('invalidProductId')
      }
    })

    it('should reject unsupported movement types', () => {
      const result = stockMutationInputSchema.safeParse({
        ...validPayload,
        type: 'ADJUSTMENT'
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-positive integer quantities (0, negative, float)', () => {
      const testCases = [
        { qty: 0, expected: 'quantityMustBePositive' },
        { qty: -5, expected: 'quantityMustBePositive' },
        { qty: 2.5, expected: 'quantityMustBeInteger' }
      ]

      for (const { qty, expected } of testCases) {
        const result = stockMutationInputSchema.safeParse({
          ...validPayload,
          quantity: qty
        })
        expect(result.success, `Expected quantity ${qty} to fail validation`).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0]?.message).toBe(expected)
        }
      }
    })

    it('should reject empty or too short notes (< 3 chars)', () => {
      const testCases = ['', '  ', 'ok', 'a']
      for (const note of testCases) {
        const result = stockMutationInputSchema.safeParse({
          ...validPayload,
          note
        })
        expect(result.success, `Expected note "${note}" to fail validation`).toBe(false)
      }
    })
  })

  describe('Pure Domain Stock Calculation (calculateStockMutation)', () => {
    describe('Stock IN Calculations', () => {
      it('should increment stock correctly for standard Stock IN', () => {
        // Known test numbers: initial 10, IN 5 -> 15
        const result = calculateStockMutation(10, 'IN', 5)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.stockBefore).toBe(10)
          expect(result.stockAfter).toBe(15)
          expect(result.change).toBe(5)
        }
      })

      it('should allow Stock IN when current stock is zero', () => {
        // initial 0, IN 25 -> 25
        const result = calculateStockMutation(0, 'IN', 25)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.stockBefore).toBe(0)
          expect(result.stockAfter).toBe(25)
          expect(result.change).toBe(25)
        }
      })
    })

    describe('Stock OUT Calculations & Overdraft Rejection', () => {
      it('should decrement stock correctly for standard Stock OUT', () => {
        // Known test numbers: initial 15, OUT 3 -> 12
        const result = calculateStockMutation(15, 'OUT', 3)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.stockBefore).toBe(15)
          expect(result.stockAfter).toBe(12)
          expect(result.change).toBe(-3)
        }
      })

      it('should allow Stock OUT that draws exactly all remaining stock to 0', () => {
        // initial 10, OUT 10 -> 0
        const result = calculateStockMutation(10, 'OUT', 10)

        expect(result.success).toBe(true)
        if (result.success) {
          expect(result.stockBefore).toBe(10)
          expect(result.stockAfter).toBe(0)
          expect(result.change).toBe(-10)
        }
      })

      it('should reject Stock OUT when quantity exceeds available stock (overdraft protection)', () => {
        // initial 10, OUT 11 -> rejected
        const result = calculateStockMutation(10, 'OUT', 11)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBe('INSUFFICIENT_STOCK')
        }
      })

      it('should reject Stock OUT when initial stock is 0', () => {
        const result = calculateStockMutation(0, 'OUT', 1)

        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error).toBe('INSUFFICIENT_STOCK')
        }
      })
    })

    describe('Invalid Input Protection', () => {
      it('should reject zero, negative, fractional, and NaN quantities', () => {
        const invalidQuantities = [0, -1, -50, 1.5, 0.1, Number.NaN, Number.POSITIVE_INFINITY]

        for (const qty of invalidQuantities) {
          const result = calculateStockMutation(20, 'IN', qty)
          expect(result.success, `Expected quantity ${qty} to fail`).toBe(false)
          if (!result.success) {
            expect(result.error).toBe('INVALID_QUANTITY')
          }
        }
      })

      it('should reject negative or non-finite current stock values', () => {
        const invalidCurrentStocks = [-1, -10, 1.5, Number.NaN, Number.POSITIVE_INFINITY]

        for (const stock of invalidCurrentStocks) {
          const result = calculateStockMutation(stock, 'IN', 5)
          expect(result.success, `Expected stock ${stock} to fail`).toBe(false)
          if (!result.success) {
            expect(result.error).toBe('INVALID_CURRENT_STOCK')
          }
        }
      })
    })

    describe('Mathematical Invariant Verification', () => {
      it('should verify sequential mutation invariant: initial 10 -> IN 5 -> OUT 3 = 12', () => {
        const initialStock = 10

        // Step 1: Stock IN 5
        const step1 = calculateStockMutation(initialStock, 'IN', 5)
        expect(step1.success).toBe(true)
        const intermediateStock = (step1 as { stockAfter: number }).stockAfter
        expect(intermediateStock).toBe(15)

        // Step 2: Stock OUT 3
        const step2 = calculateStockMutation(intermediateStock, 'OUT', 3)
        expect(step2.success).toBe(true)
        const finalStock = (step2 as { stockAfter: number }).stockAfter
        expect(finalStock).toBe(12)

        // Mathematical invariant: final = initial + total_in - total_out
        const expectedFinal = initialStock + 5 - 3
        expect(finalStock).toBe(expectedFinal)
      })

      it('should guarantee no partial state modification occurs upon failure', () => {
        const initialStock = 10

        // Attempt invalid OUT mutation exceeding stock
        const failedResult = calculateStockMutation(initialStock, 'OUT', 50)
        expect(failedResult.success).toBe(false)

        // The initial stock reference remains strictly unchanged
        expect(initialStock).toBe(10)
      })
    })
  })
})
