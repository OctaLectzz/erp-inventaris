import type { Database } from '@/types/database'
import type { MovementType, StockMovementFilters, StockMovementListResult, StockMovementWithDetails } from '@/types/inventory'
import type { SupabaseClient } from '@supabase/supabase-js'

export const DEFAULT_PAGE_SIZE = 15

interface RawMovementJoinedRow {
  id: string
  product_id: string
  user_id: string
  type: string
  quantity: number
  stock_before: number
  stock_after: number
  note: string
  created_at: string
  products: {
    id: string
    sku: string
    name: string
    category: string
    unit: string
  } | null
}

/**
 * Validates and formats ISO boundary strings for date filtering.
 */
export function parseDateRangeBoundaries(startDate?: string, endDate?: string): { startIso?: string; endIso?: string; error?: string } {
  let startIso: string | undefined
  let endIso: string | undefined

  if (startDate && startDate.trim().length > 0) {
    const trimmedStart = startDate.trim()
    const parsedStart = new Date(`${trimmedStart}T00:00:00.000Z`)
    if (isNaN(parsedStart.getTime())) {
      return { error: 'Invalid start date format' }
    }
    startIso = parsedStart.toISOString()
  }

  if (endDate && endDate.trim().length > 0) {
    const trimmedEnd = endDate.trim()
    const parsedEnd = new Date(`${trimmedEnd}T23:59:59.999Z`)
    if (isNaN(parsedEnd.getTime())) {
      return { error: 'Invalid end date format' }
    }
    endIso = parsedEnd.toISOString()
  }

  if (startIso && endIso && startIso > endIso) {
    return { error: 'Start date cannot be after end date' }
  }

  return { startIso, endIso }
}

/**
 * Retrieves paginated, filtered stock movement ledger history with linked product information.
 *
 * INVARIANTS:
 * 1. Read-only query operating within authenticated user's RLS boundaries.
 * 2. Movements are ordered chronologically descending (newest first).
 * 3. Does not mutate database state.
 */
export async function getStockMovements(supabase: SupabaseClient<Database>, filters?: StockMovementFilters): Promise<StockMovementListResult> {
  const page = Math.max(1, filters?.page || 1)
  const pageSize = Math.max(1, Math.min(100, filters?.pageSize || DEFAULT_PAGE_SIZE))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from('stock_movements')
    .select('*, products(id, sku, name, category, unit)', { count: 'exact' })
    .order('created_at', { ascending: false })

  // 1. Movement Type Filter ('IN' or 'OUT')
  if (filters?.type && filters.type !== 'ALL') {
    query = query.eq('type', filters.type)
  }

  // 2. Date Range Filter
  if (filters?.startDate || filters?.endDate) {
    const { startIso, endIso, error: dateError } = parseDateRangeBoundaries(filters.startDate, filters.endDate)
    if (dateError) {
      throw new Error(`Invalid date filter: ${dateError}`)
    }
    if (startIso) {
      query = query.gte('created_at', startIso)
    }
    if (endIso) {
      query = query.lte('created_at', endIso)
    }
  }

  // 3. Multi-Attribute Product Search Filter (SKU or Name)
  if (filters?.search && filters.search.trim().length > 0) {
    const searchPattern = filters.search.trim()
    const { data: matchedProducts, error: searchError } = await supabase
      .from('products')
      .select('id')
      .or(`sku.ilike.%${searchPattern}%,name.ilike.%${searchPattern}%`)

    if (searchError) {
      throw new Error(`Failed to filter products by search term: ${searchError.message}`)
    }

    const matchedIds = (matchedProducts || []).map((p) => p.id)
    if (matchedIds.length === 0) {
      return {
        movements: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0
      }
    }

    query = query.in('product_id', matchedIds)
  }

  // 4. Apply range pagination
  query = query.range(from, to)

  const { data: rows, error, count } = await query

  if (error) {
    throw new Error(`Failed to load stock movements: ${error.message}`)
  }

  // 5. Fetch available profiles for user attribution
  // Under RLS, returns the caller's profile.
  const { data: knownProfiles } = await supabase.from('profiles').select('id, full_name, email, role')
  const profileMap = new Map<string, { fullName: string; email?: string; role?: string }>()
  for (const prof of knownProfiles || []) {
    profileMap.set(prof.id, {
      fullName: prof.full_name,
      email: prof.email,
      role: prof.role
    })
  }

  const rawRows = (rows as unknown as RawMovementJoinedRow[]) || []
  const total = typeof count === 'number' ? count : rawRows.length
  const totalPages = Math.ceil(total / pageSize)

  const movements: StockMovementWithDetails[] = rawRows.map((row) => {
    const userProfile = profileMap.get(row.user_id)
    return {
      id: row.id,
      productId: row.product_id,
      userId: row.user_id,
      type: row.type as MovementType,
      quantity: row.quantity,
      stockBefore: row.stock_before,
      stockAfter: row.stock_after,
      note: row.note,
      createdAt: row.created_at,
      product: row.products || {
        id: row.product_id,
        sku: 'UNKNOWN',
        name: 'Produk Tidak Ditemukan',
        category: '-',
        unit: 'pcs'
      },
      user: {
        id: row.user_id,
        fullName: userProfile?.fullName || 'Admin Gudang',
        email: userProfile?.email,
        role: userProfile?.role || 'admin_gudang'
      }
    }
  })

  return {
    movements,
    total,
    page,
    pageSize,
    totalPages
  }
}
