import { describe, expect, it } from 'vitest'

import { calculateDateBoundaries } from '@/lib/date-boundaries'
import { aggregateMovementsIntoBuckets, generateEmptyBuckets } from '@/services/analytics-domain'
import { LOW_STOCK_THRESHOLD } from '@/services/inventory-domain'

import type { StockMovementLike } from '@/services/analytics-domain'

describe('Reports & Analytics Domain Calculations', () => {
  const refDate = new Date('2026-10-14T10:00:00.000Z')

  it('correctly calculates net flow delta across multiple periods', () => {
    const range = calculateDateBoundaries('month', undefined, undefined, refDate)
    const emptyBuckets = generateEmptyBuckets(range, refDate)

    const sampleMovements: StockMovementLike[] = [
      { type: 'IN', quantity: 50, createdAt: '2026-10-10T10:00:00.000Z' },
      { type: 'OUT', quantity: 20, createdAt: '2026-10-11T12:00:00.000Z' },
      { type: 'OUT', quantity: 15, createdAt: '2026-10-12T14:00:00.000Z' },
      { type: 'IN', quantity: 30, createdAt: '2026-10-13T16:00:00.000Z' }
    ]

    const result = aggregateMovementsIntoBuckets(sampleMovements, emptyBuckets, 'day')

    expect(result.totalInUnits).toBe(80)
    expect(result.totalOutUnits).toBe(35)
    expect(result.netFlow).toBe(45)
    expect(result.totalTransactions).toBe(4)
  })

  it('guarantees stock threshold safety boundary rule (< 5 is low stock, >= 5 is normal)', () => {
    expect(4 < LOW_STOCK_THRESHOLD).toBe(true)
    expect(5 < LOW_STOCK_THRESHOLD).toBe(false)
    expect(0 < LOW_STOCK_THRESHOLD).toBe(true)
    expect(10 < LOW_STOCK_THRESHOLD).toBe(false)
  })

  it('handles custom date boundary inversion gracefully', () => {
    const range = calculateDateBoundaries('custom', '2026-10-31', '2026-10-01', refDate)
    expect(range.startIso! < range.endIso!).toBe(true)
    expect(range.startDate).toBe('2026-10-01')
    expect(range.endDate).toBe('2026-10-31')
  })

  it('calculates monthly bucket rollup for year filter', () => {
    const range = calculateDateBoundaries('year', undefined, undefined, refDate)
    const emptyBuckets = generateEmptyBuckets(range, refDate)
    expect(emptyBuckets.length).toBe(12)

    const movements: StockMovementLike[] = [
      { type: 'IN', quantity: 100, createdAt: '2026-01-15T00:00:00.000Z' },
      { type: 'OUT', quantity: 40, createdAt: '2026-01-20T00:00:00.000Z' }
    ]

    const result = aggregateMovementsIntoBuckets(movements, emptyBuckets, 'month')
    const janBucket = result.buckets.find((b) => b.key === '2026-01')
    expect(janBucket).toBeDefined()
    expect(janBucket?.inQuantity).toBe(100)
    expect(janBucket?.outQuantity).toBe(40)
    expect(janBucket?.netFlow).toBe(60)
  })
})
