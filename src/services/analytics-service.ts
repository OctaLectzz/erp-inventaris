import { calculateDateBoundaries } from '@/lib/date-boundaries'
import { aggregateMovementsIntoBuckets, generateEmptyBuckets } from '@/services/analytics-domain'

import type { DateRangeResult, PeriodKey } from '@/lib/date-boundaries'
import type { PeriodAnalyticsSummary, StockMovementLike } from '@/services/analytics-domain'
import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface StockAnalyticsData {
  summary: PeriodAnalyticsSummary
  range: DateRangeResult
}

/**
 * Retrieves aggregate stock movement analytics across all products for a given period.
 *
 * INVARIANTS:
 * 1. Read-only Supabase queries under authenticated user RLS.
 * 2. Uses consistent UTC date boundaries.
 * 3. Does not fabricate trends when movement count is zero.
 */
export async function getPeriodStockAnalytics(
  supabase: SupabaseClient<Database>,
  period: PeriodKey = 'month',
  customStart?: string,
  customEnd?: string
): Promise<StockAnalyticsData> {
  const range = calculateDateBoundaries(period, customStart, customEnd)

  let query = supabase.from('stock_movements').select('id, product_id, type, quantity, created_at').order('created_at', { ascending: true })

  if (range.startIso) {
    query = query.gte('created_at', range.startIso)
  }
  if (range.endIso) {
    query = query.lte('created_at', range.endIso)
  }

  const { data: rows, error } = await query

  if (error) {
    throw new Error(`Failed to load period stock analytics: ${error.message}`)
  }

  const movements: StockMovementLike[] = (rows || []).map((r) => ({
    id: r.id,
    productId: r.product_id,
    type: r.type,
    quantity: r.quantity,
    createdAt: r.created_at
  }))

  const emptyBuckets = generateEmptyBuckets(range)
  const summary = aggregateMovementsIntoBuckets(movements, emptyBuckets, range.bucketType)

  return {
    summary,
    range
  }
}

/**
 * Retrieves specific movement analytics and history for a single product.
 */
export async function getProductMovementAnalytics(
  supabase: SupabaseClient<Database>,
  productId: string,
  period: PeriodKey = 'month',
  customStart?: string,
  customEnd?: string
) {
  const range = calculateDateBoundaries(period, customStart, customEnd)

  // 1. Fetch product identity
  const { data: product, error: prodErr } = await supabase.from('products').select('*').eq('id', productId).single()

  if (prodErr || !product) {
    throw new Error(`Product not found: ${productId}`)
  }

  // 2. Fetch movements for this product
  let query = supabase
    .from('stock_movements')
    .select('*, products(id, sku, name, category, unit)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (range.startIso) {
    query = query.gte('created_at', range.startIso)
  }
  if (range.endIso) {
    query = query.lte('created_at', range.endIso)
  }

  const { data: rows, error: movErr } = await query

  if (movErr) {
    throw new Error(`Failed to load product movements: ${movErr.message}`)
  }

  const movements: StockMovementLike[] = (rows || []).map((r) => ({
    id: r.id,
    productId: r.product_id,
    type: r.type,
    quantity: r.quantity,
    createdAt: r.created_at
  }))

  const emptyBuckets = generateEmptyBuckets(range)
  // For bucket chart, feed chronologically ascending
  const chronologicalMovements = [...movements].reverse()
  const summary = aggregateMovementsIntoBuckets(chronologicalMovements, emptyBuckets, range.bucketType)

  return {
    product,
    summary,
    range,
    rawMovements: rows || []
  }
}
