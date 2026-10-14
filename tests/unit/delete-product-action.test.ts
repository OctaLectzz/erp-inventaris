import { beforeEach, describe, expect, it, vi } from 'vitest'

import { deleteProductAction } from '@/app/actions/product-actions'
import * as supabaseServer from '@/lib/supabase/server'
import * as authService from '@/services/auth-service'

import type { Database } from '@/types/database'
import type { SupabaseClient, User } from '@supabase/supabase-js'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Delete Product Action Unit Tests', () => {
  const validAdminUser = { id: 'admin-123' } as unknown as User
  const validAdminProfile = {
    id: 'admin-123',
    email: 'admin@inventra.demo',
    fullName: 'Administrator Demo',
    role: 'administrator' as const,
    createdAt: '',
    updatedAt: ''
  }

  const validStaffProfile = {
    id: 'staff-123',
    email: 'staff@inventra.demo',
    fullName: 'Staf Gudang Demo',
    role: 'staff_gudang' as const,
    createdAt: '',
    updatedAt: ''
  }

  const validAuditorProfile = {
    id: 'auditor-123',
    email: 'auditor@inventra.demo',
    fullName: 'Auditor Demo',
    role: 'auditor' as const,
    createdAt: '',
    updatedAt: ''
  }

  const productId = '11111111-1111-4111-8111-111111111111'

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('1. Rejects unauthenticated caller with UNAUTHORIZED', async () => {
    vi.spyOn(authService, 'requireAuth').mockRejectedValueOnce(new Error('Auth failed'))

    const result = await deleteProductAction(productId, 'id')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('UNAUTHORIZED')
    }
  })

  it('2. Rejects staff_gudang role with FORBIDDEN', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValueOnce({
      user: { id: 'staff-123' } as unknown as User,
      profile: validStaffProfile
    })

    const result = await deleteProductAction(productId, 'id')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('FORBIDDEN')
    }
  })

  it('3. Rejects auditor role with FORBIDDEN', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValueOnce({
      user: { id: 'auditor-123' } as unknown as User,
      profile: validAuditorProfile
    })

    const result = await deleteProductAction(productId, 'id')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('FORBIDDEN')
    }
  })

  it('4. Rejects invalid product id with INVALID_ID', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValueOnce({
      user: validAdminUser,
      profile: validAdminProfile
    })

    const result = await deleteProductAction('', 'id')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('INVALID_ID')
    }
  })

  it('5. Returns PRODUCT_NOT_FOUND if product does not exist in database', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValueOnce({
      user: validAdminUser,
      profile: validAdminProfile
    })

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
              })
            })
          }
        }
        return {}
      })
    } as unknown as SupabaseClient<Database>

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValueOnce(mockSupabase)

    const result = await deleteProductAction(productId, 'id')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('PRODUCT_NOT_FOUND')
    }
  })

  it('6. Blocks deletion if product has existing stock movements (HAS_MOVEMENTS)', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValueOnce({
      user: validAdminUser,
      profile: validAdminProfile
    })

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: productId, name: 'Sample Item', sku: 'SMP-001', stock: 10 },
                  error: null
                })
              })
            })
          }
        }
        if (table === 'stock_movements') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 4,
                data: null,
                error: null
              })
            })
          }
        }
        return {}
      })
    } as unknown as SupabaseClient<Database>

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValueOnce(mockSupabase)

    const result = await deleteProductAction(productId, 'id')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('HAS_MOVEMENTS')
      expect(result.message).toContain('riwayat mutasi')
    }
  })

  it('7. Deletes product successfully when movement count is 0', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValueOnce({
      user: validAdminUser,
      profile: validAdminProfile
    })

    const mockDelete = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null })
    })

    const mockSupabase = {
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: productId, name: 'Brand New Item', sku: 'NEW-001', stock: 0 },
                  error: null
                })
              })
            }),
            delete: mockDelete
          }
        }
        if (table === 'stock_movements') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                count: 0,
                data: null,
                error: null
              })
            })
          }
        }
        return {}
      })
    } as unknown as SupabaseClient<Database>

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValueOnce(mockSupabase)

    const result = await deleteProductAction(productId, 'id')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.id).toBe(productId)
      expect(result.data.name).toBe('Brand New Item')
    }
    expect(mockDelete).toHaveBeenCalled()
  })
})
