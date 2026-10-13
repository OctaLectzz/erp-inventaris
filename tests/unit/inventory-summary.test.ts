import { describe, expect, it } from 'vitest'

import { calculateInventorySummary, isLowStock, LOW_STOCK_THRESHOLD } from '@/services/inventory-domain'

describe('Inventory Summary & Metrics Domain Unit Tests', () => {
  describe('Low Stock Threshold Rule (< 5)', () => {
    it('should export threshold constant of exactly 5', () => {
      expect(LOW_STOCK_THRESHOLD).toBe(5)
    })

    it('should evaluate strictly less than 5 (< 5) and NOT less than or equal to 5 (<= 5)', () => {
      // 0, 1, 2, 3, 4 units are LOW STOCK
      expect(isLowStock(0)).toBe(true)
      expect(isLowStock(1)).toBe(true)
      expect(isLowStock(2)).toBe(true)
      expect(isLowStock(3)).toBe(true)
      expect(isLowStock(4)).toBe(true)

      // 5 units is NORMAL STOCK (critical test requirement: strictly < 5, not <= 5)
      expect(isLowStock(5)).toBe(false)

      // 6 or more units is NORMAL STOCK
      expect(isLowStock(6)).toBe(false)
      expect(isLowStock(10)).toBe(false)
      expect(isLowStock(100)).toBe(false)
    })

    it('should safely return false for invalid non-numeric stock values', () => {
      expect(isLowStock(Number.NaN)).toBe(false)
      expect(isLowStock(Number.POSITIVE_INFINITY)).toBe(false)
    })
  })

  describe('Inventory KPI Calculations (calculateInventorySummary)', () => {
    it('should compute exact counts, units, valuation, and low stock for standard catalog', () => {
      const items = [
        { stock: 10, price: 100_000 }, // value: 1,000,000, normal stock
        { stock: 4, price: 250_000 }, // value: 1,000,000, LOW STOCK (4 < 5)
        { stock: 5, price: 50_000 }, // value: 250,000, NORMAL STOCK (5 is not < 5)
        { stock: 0, price: 300_000 }, // value: 0, LOW STOCK (0 < 5)
        { stock: 20, price: 10_000 } // value: 200,000, normal stock
      ]

      const summary = calculateInventorySummary(items)

      // Total distinct SKUs: 5
      expect(summary.totalSkus).toBe(5)

      // Total units: 10 + 4 + 5 + 0 + 20 = 39
      expect(summary.totalUnits).toBe(39)

      // Total valuation: 1,000,000 + 1,000,000 + 250,000 + 0 + 200,000 = 2,450,000 IDR
      expect(summary.totalInventoryValue).toBe(2_450_000)

      // Low stock items: items with stock 4 and stock 0 -> exactly 2
      expect(summary.lowStockCount).toBe(2)
    })

    it('should safely handle an empty catalog without errors', () => {
      const emptySummary = calculateInventorySummary([])

      expect(emptySummary).toEqual({
        totalSkus: 0,
        totalUnits: 0,
        totalInventoryValue: 0,
        lowStockCount: 0
      })
    })

    it('should safely sanitize and ignore negative, NaN, or non-finite numbers', () => {
      const malformedItems = [
        { stock: -5, price: 100_000 }, // negative stock treated as 0
        { stock: 10, price: -50_000 }, // negative price treated as 0
        { stock: Number.NaN, price: 100_000 }, // NaN treated as 0
        { stock: 10, price: Number.NaN } // NaN price treated as 0
      ]

      const summary = calculateInventorySummary(malformedItems)

      expect(summary.totalSkus).toBe(4)
      expect(summary.totalUnits).toBe(20) // Two items with valid stock of 10 = 20
      expect(summary.totalInventoryValue).toBe(0) // No positive value
      expect(summary.lowStockCount).toBe(2) // Items 1 and 3 are < 5
    })

    it('should protect against precision loss when values approach MAX_SAFE_INTEGER', () => {
      const largeItems = [
        { stock: 1_000_000_000, price: 1_000_000_000 }, // 10^18 (approaching safe integer ceiling)
        { stock: 50, price: 20_000 }
      ]

      const summary = calculateInventorySummary(largeItems)

      expect(Number.isSafeInteger(summary.totalInventoryValue)).toBe(true)
      expect(summary.totalInventoryValue).toBeGreaterThan(0)
    })
  })
})
