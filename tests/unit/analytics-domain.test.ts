import { describe, expect, it } from 'vitest'

import { calculateDateBoundaries } from '@/lib/date-boundaries'
import { aggregateMovementsIntoBuckets, generateEmptyBuckets } from '@/services/analytics-domain'

import type { StockMovementLike } from '@/services/analytics-domain'

describe('Analytics Domain Movement Aggregation', () => {
  const refDate = new Date('2026-10-14T12:00:00.000Z')

  it('generates 7 daily buckets for week period', () => {
    const range = calculateDateBoundaries('week', undefined, undefined, refDate)
    const buckets = generateEmptyBuckets(range, refDate)
    expect(buckets.length).toBe(7)
    expect(buckets[0].inQuantity).toBe(0)
    expect(buckets[0].outQuantity).toBe(0)
  })

  it('generates 12 monthly buckets for year period', () => {
    const range = calculateDateBoundaries('year', undefined, undefined, refDate)
    const buckets = generateEmptyBuckets(range, refDate)
    expect(buckets.length).toBe(12)
    expect(buckets[0].label).toBe('Jan')
    expect(buckets[11].label).toBe('Des')
  })

  it('aggregates stock IN and OUT accurately into corresponding buckets', () => {
    const range = calculateDateBoundaries('week', undefined, undefined, refDate)
    const emptyBuckets = generateEmptyBuckets(range, refDate)

    const movements: StockMovementLike[] = [
      {
        type: 'IN',
        quantity: 25,
        createdAt: '2026-10-14T08:30:00.000Z'
      },
      {
        type: 'OUT',
        quantity: 10,
        createdAt: '2026-10-14T09:15:00.000Z'
      },
      {
        type: 'IN',
        quantity: 15,
        createdAt: '2026-10-13T14:00:00.000Z'
      }
    ]

    const result = aggregateMovementsIntoBuckets(movements, emptyBuckets, 'day')

    expect(result.totalInUnits).toBe(40)
    expect(result.totalOutUnits).toBe(10)
    expect(result.netFlow).toBe(30)
    expect(result.totalTransactions).toBe(3)

    const todayBucket = result.buckets.find((b) => b.key === '2026-10-14')
    expect(todayBucket).toBeDefined()
    expect(todayBucket?.inQuantity).toBe(25)
    expect(todayBucket?.outQuantity).toBe(10)
    expect(todayBucket?.netFlow).toBe(15)
    expect(todayBucket?.transactionCount).toBe(2)
  })

  it('handles empty movement array gracefully without throwing', () => {
    const range = calculateDateBoundaries('week', undefined, undefined, refDate)
    const emptyBuckets = generateEmptyBuckets(range, refDate)
    const result = aggregateMovementsIntoBuckets([], emptyBuckets, 'day')

    expect(result.totalInUnits).toBe(0)
    expect(result.totalOutUnits).toBe(0)
    expect(result.netFlow).toBe(0)
    expect(result.totalTransactions).toBe(0)
    expect(result.buckets.length).toBe(7)
  })

  it('ignores invalid or negative quantities', () => {
    const range = calculateDateBoundaries('week', undefined, undefined, refDate)
    const emptyBuckets = generateEmptyBuckets(range, refDate)

    const invalidMovements = [
      { type: 'IN', quantity: -5, createdAt: '2026-10-14T10:00:00.000Z' },
      { type: 'UNKNOWN', quantity: 10, createdAt: '2026-10-14T10:00:00.000Z' }
    ] as StockMovementLike[]

    const result = aggregateMovementsIntoBuckets(invalidMovements, emptyBuckets, 'day')
    expect(result.totalInUnits).toBe(0)
    expect(result.totalOutUnits).toBe(0)
    expect(result.totalTransactions).toBe(0)
  })
})
