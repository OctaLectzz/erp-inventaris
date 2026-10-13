import { describe, expect, it } from 'vitest'

import { validateStockMovement } from '@/services/inventory-domain'
import { isValidMovementType, MOVEMENT_TYPES } from '@/types/inventory'

import { createMockStockMovement } from '../fixtures/inventory-fixtures'

describe('Stock Ledger & Movement History Domain Unit Tests', () => {
  describe('Movement Type Validation (isValidMovementType)', () => {
    it('should validate standard IN and OUT types', () => {
      expect(isValidMovementType('IN')).toBe(true)
      expect(isValidMovementType('OUT')).toBe(true)
      expect(MOVEMENT_TYPES.IN).toBe('IN')
      expect(MOVEMENT_TYPES.OUT).toBe('OUT')
    })

    it('should reject invalid or unsupported movement types', () => {
      const invalidTypes = ['in', 'out', 'TRANSFER', 'ADJUST', 'RETURN', '', null, undefined, 123]
      for (const t of invalidTypes) {
        expect(isValidMovementType(t)).toBe(false)
      }
    })
  })

  describe('Ledger Invariant Verification (validateStockMovement)', () => {
    it('should accept a valid Stock IN ledger record with consistent numbers', () => {
      const validInMovement = createMockStockMovement({
        type: 'IN',
        quantity: 10,
        stockBefore: 20,
        stockAfter: 30,
        note: 'Penerimaan stok berkala'
      })

      expect(validateStockMovement(validInMovement)).toBe(true)
    })

    it('should accept a valid Stock OUT ledger record with consistent numbers', () => {
      const validOutMovement = createMockStockMovement({
        type: 'OUT',
        quantity: 5,
        stockBefore: 30,
        stockAfter: 25,
        note: 'Pengiriman barang ke cabang'
      })

      expect(validateStockMovement(validOutMovement)).toBe(true)
    })

    it('should reject ledger records where stockAfter does not match stockBefore + delta', () => {
      // Invariant violated: IN 5 with stockBefore 10 should produce 15, but record says 20
      const corruptedMovement = createMockStockMovement({
        type: 'IN',
        quantity: 5,
        stockBefore: 10,
        stockAfter: 20 // Corrupted!
      })

      expect(validateStockMovement(corruptedMovement)).toBe(false)
    })

    it('should reject ledger records with zero or negative quantities', () => {
      const zeroQtyMovement = createMockStockMovement({
        quantity: 0,
        stockBefore: 10,
        stockAfter: 10
      })
      expect(validateStockMovement(zeroQtyMovement)).toBe(false)

      const negQtyMovement = createMockStockMovement({
        quantity: -5,
        stockBefore: 10,
        stockAfter: 5
      })
      expect(validateStockMovement(negQtyMovement)).toBe(false)
    })

    it('should reject ledger records with missing or empty notes (< 3 characters)', () => {
      const shortNoteMovement = createMockStockMovement({
        note: 'ab' // Less than 3 chars
      })
      expect(validateStockMovement(shortNoteMovement)).toBe(false)

      const emptyNoteMovement = createMockStockMovement({
        note: '   '
      })
      expect(validateStockMovement(emptyNoteMovement)).toBe(false)
    })

    it('should reject ledger records with missing foreign keys (productId or userId)', () => {
      const missingProduct = createMockStockMovement({
        productId: ''
      })
      expect(validateStockMovement(missingProduct)).toBe(false)

      const missingUser = createMockStockMovement({
        userId: ''
      })
      expect(validateStockMovement(missingUser)).toBe(false)
    })
  })
})
