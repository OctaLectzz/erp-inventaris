import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getStockMovements, parseDateRangeBoundaries } from '@/services/stock-movement-service'

import type { Database } from '@/types/database'
import type { SupabaseClient } from '@supabase/supabase-js'

describe('Stock Movement Service Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('parseDateRangeBoundaries', () => {
    it('should format valid start and end dates to UTC ISO boundaries', () => {
      const res = parseDateRangeBoundaries('2026-10-14', '2026-10-15')
      expect(res.error).toBeUndefined()
      expect(res.startIso).toBe('2026-10-14T00:00:00.000Z')
      expect(res.endIso).toBe('2026-10-15T23:59:59.999Z')
    })

    it('should return error when start date is after end date', () => {
      const res = parseDateRangeBoundaries('2026-10-16', '2026-10-14')
      expect(res.error).toBe('Start date cannot be after end date')
    })

    it('should reject malformed date inputs', () => {
      const badStart = parseDateRangeBoundaries('not-a-date', '2026-10-15')
      expect(badStart.error).toBe('Invalid start date format')

      const badEnd = parseDateRangeBoundaries('2026-10-14', 'invalid-date')
      expect(badEnd.error).toBe('Invalid end date format')
    })

    it('should return empty bounds when inputs are omitted', () => {
      const res = parseDateRangeBoundaries(undefined, undefined)
      expect(res.error).toBeUndefined()
      expect(res.startIso).toBeUndefined()
      expect(res.endIso).toBeUndefined()
    })
  })

  describe('getStockMovements', () => {
    const mockMovementRows = [
      {
        id: 'mov-1',
        product_id: 'prod-1',
        user_id: 'user-admin',
        type: 'IN',
        quantity: 10,
        stock_before: 5,
        stock_after: 15,
        note: 'Penerimaan batch supplier',
        created_at: '2026-10-14T10:00:00Z',
        products: {
          id: 'prod-1',
          sku: 'SKU-001',
          name: 'Premium Widget',
          category: 'hardware',
          unit: 'pcs'
        }
      },
      {
        id: 'mov-2',
        product_id: 'prod-2',
        user_id: 'user-admin',
        type: 'OUT',
        quantity: 3,
        stock_before: 15,
        stock_after: 12,
        note: 'Pengeluaran display toko',
        created_at: '2026-10-14T11:00:00Z',
        products: {
          id: 'prod-2',
          sku: 'SKU-002',
          name: 'Gadget Deluxe',
          category: 'electronics',
          unit: 'box'
        }
      }
    ]

    it('should retrieve all movements with pagination and link product details', async () => {
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockMovementRows,
          error: null,
          count: 2
        })
      }

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'stock_movements') {
            return queryBuilder
          }
          if (table === 'profiles') {
            return {
              select: vi.fn().mockResolvedValue({
                data: [{ id: 'user-admin', full_name: 'Admin Gudang Demo', email: 'admin@demo.com', role: 'admin_gudang' }],
                error: null
              })
            }
          }
          return queryBuilder
        })
      }

      const result = await getStockMovements(mockSupabase as unknown as SupabaseClient<Database>, {
        page: 1,
        pageSize: 10
      })

      expect(result.movements).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.totalPages).toBe(1)
      expect(result.movements[0].product.sku).toBe('SKU-001')
      expect(result.movements[0].user?.fullName).toBe('Admin Gudang Demo')
      expect(result.movements[1].type).toBe('OUT')
    })

    it('should apply type filter when specified', async () => {
      const eqMock = vi.fn().mockReturnThis()
      const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        eq: eqMock,
        range: vi.fn().mockResolvedValue({
          data: [mockMovementRows[1]],
          error: null,
          count: 1
        })
      }

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'stock_movements') return queryBuilder
          if (table === 'profiles') {
            return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
          }
          return queryBuilder
        })
      }

      const result = await getStockMovements(mockSupabase as unknown as SupabaseClient<Database>, {
        type: 'OUT'
      })

      expect(eqMock).toHaveBeenCalledWith('type', 'OUT')
      expect(result.movements).toHaveLength(1)
      expect(result.movements[0].type).toBe('OUT')
    })

    it('should apply search filter by querying products first and constraining product_id', async () => {
      const inMock = vi.fn().mockReturnThis()
      const movementsQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        in: inMock,
        range: vi.fn().mockResolvedValue({
          data: [mockMovementRows[0]],
          error: null,
          count: 1
        })
      }

      const productsQueryBuilder = {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockResolvedValue({
          data: [{ id: 'prod-1' }],
          error: null
        })
      }

      const mockSupabase = {
        from: vi.fn().mockImplementation((table: string) => {
          if (table === 'stock_movements') return movementsQueryBuilder
          if (table === 'products') return productsQueryBuilder
          if (table === 'profiles') return { select: vi.fn().mockResolvedValue({ data: [], error: null }) }
          return movementsQueryBuilder
        })
      }

      const result = await getStockMovements(mockSupabase as unknown as SupabaseClient<Database>, {
        search: 'Widget'
      })

      expect(inMock).toHaveBeenCalledWith('product_id', ['prod-1'])
      expect(result.movements).toHaveLength(1)
      expect(result.movements[0].product.name).toBe('Premium Widget')
    })
  })
})
