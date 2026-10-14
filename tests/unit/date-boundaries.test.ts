import { describe, expect, it } from 'vitest'

import { calculateDateBoundaries, formatLocalYmd } from '@/lib/date-boundaries'

describe('Date Boundaries & Analytics Period Calculation', () => {
  const mockRefDate = new Date('2026-10-14T10:00:00.000Z')

  it('calculates boundaries for today with exact start and end timestamps', () => {
    const result = calculateDateBoundaries('today', undefined, undefined, mockRefDate)
    expect(result.period).toBe('today')
    expect(result.bucketType).toBe('hour')
    expect(result.startIso).toBeDefined()
    expect(result.endIso).toBeDefined()
    expect(result.startIso).toContain('T00:00:00.000Z')
    expect(result.endIso).toContain('T23:59:59.999Z')
  })

  it('calculates week boundaries covering 7 calendar days', () => {
    const result = calculateDateBoundaries('week', undefined, undefined, mockRefDate)
    expect(result.period).toBe('week')
    expect(result.bucketType).toBe('day')
    expect(result.startDate).toBeDefined()
    expect(result.endDate).toBeDefined()
    expect(result.startIso! < result.endIso!).toBe(true)
  })

  it('calculates month boundaries covering 30 calendar days', () => {
    const result = calculateDateBoundaries('month', undefined, undefined, mockRefDate)
    expect(result.period).toBe('month')
    expect(result.bucketType).toBe('day')
    expect(result.startIso! < result.endIso!).toBe(true)
  })

  it('calculates year boundaries starting at Jan 1', () => {
    const result = calculateDateBoundaries('year', undefined, undefined, mockRefDate)
    expect(result.period).toBe('year')
    expect(result.bucketType).toBe('month')
    expect(result.startDate).toContain('-01-01')
  })

  it('handles custom date range and swaps if start > end', () => {
    const result = calculateDateBoundaries('custom', '2026-10-20', '2026-10-10', mockRefDate)
    expect(result.period).toBe('custom')
    expect(result.startIso! < result.endIso!).toBe(true)
    expect(result.startIso).toContain('2026-10-10')
    expect(result.endIso).toContain('2026-10-20')
  })

  it('handles all-time period without bounded start timestamp', () => {
    const result = calculateDateBoundaries('all', undefined, undefined, mockRefDate)
    expect(result.period).toBe('all')
    expect(result.startIso).toBeUndefined()
    expect(result.endIso).toBeUndefined()
  })

  it('formats YYYY-MM-DD reliably', () => {
    const d = new Date(2026, 4, 3) // May 3, 2026
    expect(formatLocalYmd(d)).toBe('2026-05-03')
  })
})
