import type { DateRangeResult } from '@/lib/date-boundaries'
import type { MovementType } from '@/types/inventory'

export interface StockMovementLike {
  id?: string
  productId?: string
  type: MovementType | string
  quantity: number
  createdAt: string
}

export interface AnalyticsTimeBucket {
  key: string
  label: string
  inQuantity: number
  outQuantity: number
  netFlow: number
  transactionCount: number
}

export interface PeriodAnalyticsSummary {
  totalInUnits: number
  totalOutUnits: number
  netFlow: number
  totalTransactions: number
  buckets: AnalyticsTimeBucket[]
}

/**
 * Generates empty chronological time buckets according to date boundary specifications.
 */
export function generateEmptyBuckets(range: DateRangeResult, refDate: Date = new Date()): AnalyticsTimeBucket[] {
  const buckets: AnalyticsTimeBucket[] = []

  if (range.period === 'today') {
    // 24 hour buckets: 00:00 to 23:00
    for (let h = 0; h < 24; h += 2) {
      const hh = h < 10 ? `0${h}` : `${h}`
      const nextH = h + 2 < 10 ? `0${h + 2}` : `${h + 2}`
      buckets.push({
        key: `${hh}:00`,
        label: `${hh}:00-${nextH}:00`,
        inQuantity: 0,
        outQuantity: 0,
        netFlow: 0,
        transactionCount: 0
      })
    }
    return buckets
  }

  if (range.period === 'week' || (range.period === 'custom' && range.bucketType === 'day') || range.period === 'month') {
    const daysCount = range.period === 'week' ? 7 : range.period === 'month' ? 30 : 14
    const start = range.startDate ? new Date(range.startDate) : new Date(refDate)
    if (!range.startDate) {
      start.setDate(start.getDate() - (daysCount - 1))
    }

    const cur = new Date(start)
    for (let i = 0; i < daysCount; i++) {
      const y = cur.getFullYear()
      const m = cur.getMonth() + 1 < 10 ? `0${cur.getMonth() + 1}` : `${cur.getMonth() + 1}`
      const d = cur.getDate() < 10 ? `0${cur.getDate()}` : `${cur.getDate()}`
      const ymd = `${y}-${m}-${d}`
      const dayLabel = `${cur.getDate()}/${cur.getMonth() + 1}`

      buckets.push({
        key: ymd,
        label: dayLabel,
        inQuantity: 0,
        outQuantity: 0,
        netFlow: 0,
        transactionCount: 0
      })
      cur.setDate(cur.getDate() + 1)
    }
    return buckets
  }

  if (range.period === 'year' || range.period === 'all' || range.bucketType === 'month') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const year = refDate.getFullYear()
    for (let m = 0; m < 12; m++) {
      const mm = m + 1 < 10 ? `0${m + 1}` : `${m + 1}`
      buckets.push({
        key: `${year}-${mm}`,
        label: months[m],
        inQuantity: 0,
        outQuantity: 0,
        netFlow: 0,
        transactionCount: 0
      })
    }
    return buckets
  }

  return buckets
}

/**
 * Resolves which bucket key a given movement belongs to.
 */
function resolveBucketKey(createdAt: string, bucketType: 'hour' | 'day' | 'month'): string {
  const d = new Date(createdAt)
  if (isNaN(d.getTime())) return ''

  if (bucketType === 'hour') {
    const hour = d.getUTCHours()
    const evenHour = Math.floor(hour / 2) * 2
    return evenHour < 10 ? `0${evenHour}:00` : `${evenHour}:00`
  }

  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + 1 < 10 ? `0${d.getUTCMonth() + 1}` : `${d.getUTCMonth() + 1}`
  const day = d.getUTCDate() < 10 ? `0${d.getUTCDate()}` : `${d.getUTCDate()}`

  if (bucketType === 'month') {
    return `${y}-${m}`
  }

  return `${y}-${m}-${day}`
}

/**
 * Pure domain calculation: Aggregates ledger movements into time buckets.
 *
 * INVARIANTS:
 * 1. Safe arithmetic: Quantities are sanitized to positive integers.
 * 2. Net flow: inQuantity - outQuantity.
 * 3. Total units: Matches sum of bucket quantities.
 */
export function aggregateMovementsIntoBuckets(
  movements: StockMovementLike[],
  initialBuckets: AnalyticsTimeBucket[],
  bucketType: 'hour' | 'day' | 'month'
): PeriodAnalyticsSummary {
  // Deep clone buckets to preserve immutability
  const bucketMap = new Map<string, AnalyticsTimeBucket>()
  const buckets: AnalyticsTimeBucket[] = initialBuckets.map((b) => {
    const clone = { ...b }
    bucketMap.set(clone.key, clone)
    return clone
  })

  let totalInUnits = 0
  let totalOutUnits = 0
  let totalTransactions = 0

  for (const m of movements) {
    if (!m || (m.type !== 'IN' && m.type !== 'OUT')) continue
    const qty = Number.isFinite(m.quantity) && m.quantity > 0 ? Math.floor(m.quantity) : 0
    if (qty === 0) continue

    totalTransactions++
    if (m.type === 'IN') {
      totalInUnits += qty
    } else {
      totalOutUnits += qty
    }

    const key = resolveBucketKey(m.createdAt, bucketType)
    const targetBucket = bucketMap.get(key)
    if (targetBucket) {
      targetBucket.transactionCount++
      if (m.type === 'IN') {
        targetBucket.inQuantity += qty
      } else {
        targetBucket.outQuantity += qty
      }
      targetBucket.netFlow = targetBucket.inQuantity - targetBucket.outQuantity
    }
  }

  return {
    totalInUnits,
    totalOutUnits,
    netFlow: totalInUnits - totalOutUnits,
    totalTransactions,
    buckets
  }
}
