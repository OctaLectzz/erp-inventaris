import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createProductAction, updateProductAction } from '@/app/actions/product-actions'
import * as supabaseServer from '@/lib/supabase/server'
import * as authService from '@/services/auth-service'
import { getCatalogCategories, getInventoryCatalogData, getInventoryDashboardData } from '@/services/product-service'

import type { Database } from '@/types/database'
import type { SupabaseClient, User } from '@supabase/supabase-js'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Product Service & Actions Unit Tests', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('getInventoryDashboardData', () => {
    it('should compute KPI summaries and extract low stock items (< 5 units)', async () => {
      const mockRows = [
        {
          id: 'prod-1',
          sku: 'SKU-001',
          name: 'Item One',
          category: 'cat1',
          unit: 'pcs',
          price: 100_000,
          stock: 10,
          description: null,
          image_url: null,
          created_at: '2026-10-13T00:00:00Z',
          updated_at: '2026-10-13T00:00:00Z'
        },
        {
          id: 'prod-2',
          sku: 'SKU-002',
          name: 'Low Stock Item',
          category: 'cat2',
          unit: 'pcs',
          price: 50_000,
          stock: 3, // strictly < 5
          description: null,
          image_url: null,
          created_at: '2026-10-13T00:00:00Z',
          updated_at: '2026-10-13T00:00:00Z'
        },
        {
          id: 'prod-3',
          sku: 'SKU-003',
          name: 'Critical Zero Item',
          category: 'cat1',
          unit: 'pcs',
          price: 200_000,
          stock: 0, // strictly < 5
          description: null,
          image_url: null,
          created_at: '2026-10-13T00:00:00Z',
          updated_at: '2026-10-13T00:00:00Z'
        },
        {
          id: 'prod-4',
          sku: 'SKU-004',
          name: 'Boundary Item 5 Units',
          category: 'cat3',
          unit: 'pcs',
          price: 80_000,
          stock: 5, // normal (not < 5)
          description: null,
          image_url: null,
          created_at: '2026-10-13T00:00:00Z',
          updated_at: '2026-10-13T00:00:00Z'
        }
      ]

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockRows, error: null })
          })
        })
      } as unknown as SupabaseClient<Database>

      const result = await getInventoryDashboardData(mockSupabase)

      expect(result.summary.totalSkus).toBe(4)
      expect(result.summary.totalUnits).toBe(18) // 10 + 3 + 0 + 5
      expect(result.summary.lowStockCount).toBe(2) // 3 and 0
      // Valuation: (10*100k) + (3*50k) + (0*200k) + (5*80k) = 1,000,000 + 150,000 + 0 + 400,000 = 1,550,000
      expect(result.summary.totalInventoryValue).toBe(1_550_000)

      expect(result.lowStockProducts).toHaveLength(2)
      // Sorted by stock asc: 0 units first, then 3 units
      expect(result.lowStockProducts[0].stock).toBe(0)
      expect(result.lowStockProducts[1].stock).toBe(3)
    })

    it('should return safe zeroes on empty catalog', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [], error: null })
          })
        })
      } as unknown as SupabaseClient<Database>

      const result = await getInventoryDashboardData(mockSupabase)

      expect(result.summary.totalSkus).toBe(0)
      expect(result.summary.totalUnits).toBe(0)
      expect(result.summary.totalInventoryValue).toBe(0)
      expect(result.summary.lowStockCount).toBe(0)
      expect(result.lowStockProducts).toEqual([])
    })
  })

  describe('getInventoryCatalogData', () => {
    const mockRows = [
      {
        id: 'p1',
        sku: 'BEA-MASCARA-01',
        name: 'Essence Mascara',
        category: 'beauty',
        unit: 'pcs',
        price: 160_000,
        stock: 12,
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z'
      },
      {
        id: 'p2',
        sku: 'BEA-LIPSTICK-02',
        name: 'Matte Red Lipstick',
        category: 'beauty',
        unit: 'pcs',
        price: 200_000,
        stock: 3, // low stock
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z'
      },
      {
        id: 'p3',
        sku: 'GRO-APPLE-01',
        name: 'Fresh Red Apple',
        category: 'groceries',
        unit: 'pcs',
        price: 30_000,
        stock: 50,
        created_at: '2026-10-13T00:00:00Z',
        updated_at: '2026-10-13T00:00:00Z'
      }
    ]

    it('should filter products by search query on SKU or Name', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockRows, error: null })
          })
        })
      } as unknown as SupabaseClient<Database>

      // Search by SKU substring
      const resSku = await getInventoryCatalogData(mockSupabase, { search: 'GRO-APP' })
      expect(resSku).toHaveLength(1)
      expect(resSku[0].sku).toBe('GRO-APPLE-01')

      // Search by product name substring
      const resName = await getInventoryCatalogData(mockSupabase, { search: 'Lipstick' })
      expect(resName).toHaveLength(1)
      expect(resName[0].name).toBe('Matte Red Lipstick')
    })

    it('should filter products by stock status (low_stock vs normal)', async () => {
      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockRows, error: null })
          })
        })
      } as unknown as SupabaseClient<Database>

      const lowStockRes = await getInventoryCatalogData(mockSupabase, { stockStatus: 'low_stock' })
      expect(lowStockRes).toHaveLength(1)
      expect(lowStockRes[0].stock).toBe(3)

      const normalRes = await getInventoryCatalogData(mockSupabase, { stockStatus: 'normal' })
      expect(normalRes).toHaveLength(2)
      expect(normalRes.map((p) => p.stock)).toEqual([12, 50])
    })
  })

  describe('getCatalogCategories', () => {
    it('should return unique sorted category strings', async () => {
      const mockRows = [{ category: 'groceries' }, { category: 'beauty' }, { category: 'groceries' }, { category: 'furniture' }]

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockResolvedValue({ data: mockRows, error: null })
        })
      } as unknown as SupabaseClient<Database>

      const categories = await getCatalogCategories(mockSupabase)
      expect(categories).toEqual(['beauty', 'furniture', 'groceries'])
    })
  })

  describe('Server Actions: RBAC and Stock Immutability', () => {
    it('should reject createProductAction if user role is owner (FORBIDDEN)', async () => {
      vi.spyOn(authService, 'requireAuth').mockResolvedValue({
        user: { id: 'owner-id' } as unknown as User,
        profile: {
          id: 'owner-id',
          email: 'owner@inventra.demo',
          fullName: 'Pak Owner',
          role: 'owner',
          createdAt: '',
          updatedAt: ''
        }
      })

      const result = await createProductAction({
        sku: 'OWNER-TRY-01',
        name: 'Forbidden Item',
        category: 'general',
        unit: 'pcs',
        price: 100_000
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('FORBIDDEN')
      }
    })

    it('should reject updateProductAction if user role is owner (FORBIDDEN)', async () => {
      vi.spyOn(authService, 'requireAuth').mockResolvedValue({
        user: { id: 'owner-id' } as unknown as User,
        profile: {
          id: 'owner-id',
          email: 'owner@inventra.demo',
          fullName: 'Pak Owner',
          role: 'owner',
          createdAt: '',
          updatedAt: ''
        }
      })

      const result = await updateProductAction({
        id: '11111111-1111-1111-1111-111111111111',
        sku: 'OWNER-TRY-01',
        name: 'Forbidden Update',
        category: 'general',
        unit: 'pcs',
        price: 100_000
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('FORBIDDEN')
      }
    })

    it('should guarantee that createProductAction NEVER passes stock to insert payload', async () => {
      vi.spyOn(authService, 'requireAuth').mockResolvedValue({
        user: { id: 'admin-id' } as unknown as User,
        profile: {
          id: 'admin-id',
          email: 'admin@inventra.demo',
          fullName: 'Warehouse Admin',
          role: 'admin_gudang',
          createdAt: '',
          updatedAt: ''
        }
      })

      const insertMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'new-prod-id',
              sku: 'NEW-ITEM-01',
              name: 'New Item',
              category: 'hardware',
              unit: 'pcs',
              price: 75_000,
              stock: 0, // default from DB
              description: null,
              image_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            error: null
          })
        })
      })

      const mockSupabase = {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            ilike: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
            })
          }),
          insert: insertMock
        })
      }

      vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)

      const result = await createProductAction({
        sku: 'NEW-ITEM-01',
        name: 'New Item',
        category: 'hardware',
        unit: 'pcs',
        price: 75_000
      })

      expect(result.success).toBe(true)
      expect(insertMock).toHaveBeenCalledTimes(1)
      const passedPayload = insertMock.mock.calls[0][0]

      // INVARIANT CHECK: stock MUST NOT be present in insert call
      expect(passedPayload.stock).toBeUndefined()
      expect(Object.keys(passedPayload)).not.toContain('stock')
      expect(passedPayload.sku).toBe('NEW-ITEM-01')
    })
  })
})
