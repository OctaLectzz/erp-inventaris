import { beforeEach, describe, expect, it, vi } from 'vitest'

import { recordStockMovementAction } from '@/app/actions/stock-actions'
import * as supabaseServer from '@/lib/supabase/server'
import * as authService from '@/services/auth-service'

import type { Database } from '@/types/database'
import type { SupabaseClient, User } from '@supabase/supabase-js'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Stock Mutation Server Action Unit Tests', () => {
  const validAdminUser = { id: 'edca6478-3197-4f48-ab94-6bd81d233a26' } as unknown as User
  const validAdminProfile = {
    id: 'edca6478-3197-4f48-ab94-6bd81d233a26',
    email: 'admin@inventra.demo',
    fullName: 'Admin Gudang Demo',
    role: 'admin_gudang' as const,
    createdAt: '',
    updatedAt: ''
  }

  const validOwnerUser = { id: '6cefc54f-cd78-4ca5-8702-cfba44dda68f' } as unknown as User
  const validOwnerProfile = {
    id: '6cefc54f-cd78-4ca5-8702-cfba44dda68f',
    email: 'owner@inventra.demo',
    fullName: 'Business Owner Demo',
    role: 'owner' as const,
    createdAt: '',
    updatedAt: ''
  }

  const validProductId = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('should reject unauthenticated caller with UNAUTHORIZED error', async () => {
    vi.spyOn(authService, 'requireAuth').mockRejectedValue(new Error('NEXT_REDIRECT'))

    const result = await recordStockMovementAction({
      productId: validProductId,
      type: 'IN',
      quantity: 10,
      note: 'Restock mingguan'
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('UNAUTHORIZED')
    }
  })

  it('should reject owner caller with FORBIDDEN error (Server-side RBAC enforcement)', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValue({
      user: validOwnerUser,
      profile: validOwnerProfile
    })

    const result = await recordStockMovementAction({
      productId: validProductId,
      type: 'IN',
      quantity: 10,
      note: 'Owner attempting mutation'
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('FORBIDDEN')
    }
  })

  it('should reject invalid inputs before querying database (Zod validation)', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValue({
      user: validAdminUser,
      profile: validAdminProfile
    })

    // Quantity 0
    const resultZero = await recordStockMovementAction({
      productId: validProductId,
      type: 'IN',
      quantity: 0,
      note: 'Valid note'
    })
    expect(resultZero.success).toBe(false)
    if (!resultZero.success) {
      expect(resultZero.error).toBe('VALIDATION_ERROR')
      expect(resultZero.fieldErrors?.quantity).toBe('quantityMustBePositive')
    }

    // Invalid UUID
    const resultBadUuid = await recordStockMovementAction({
      productId: 'not-a-uuid',
      type: 'IN',
      quantity: 5,
      note: 'Valid note'
    })
    expect(resultBadUuid.success).toBe(false)
    if (!resultBadUuid.success) {
      expect(resultBadUuid.error).toBe('VALIDATION_ERROR')
    }

    // Short note (< 3 chars)
    const resultShortNote = await recordStockMovementAction({
      productId: validProductId,
      type: 'IN',
      quantity: 5,
      note: 'hi'
    })
    expect(resultShortNote.success).toBe(false)
    if (!resultShortNote.success) {
      expect(resultShortNote.error).toBe('VALIDATION_ERROR')
      expect(resultShortNote.fieldErrors?.note).toBe('noteMinLength')
    }
  })

  it('should reject when target product is not found in database', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValue({
      user: validAdminUser,
      profile: validAdminProfile
    })

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
          })
        })
      }),
      rpc: vi.fn()
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)

    const result = await recordStockMovementAction({
      productId: validProductId,
      type: 'IN',
      quantity: 10,
      note: 'Restock missing product'
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('PRODUCT_NOT_FOUND')
    }
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('should reject Stock OUT when requested quantity exceeds available stock', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValue({
      user: validAdminUser,
      profile: validAdminProfile
    })

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: validProductId, name: 'Sample Item', sku: 'SMP-01', stock: 5 },
              error: null
            })
          })
        })
      }),
      rpc: vi.fn()
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)

    // Requesting 10 units when available is only 5
    const result = await recordStockMovementAction({
      productId: validProductId,
      type: 'OUT',
      quantity: 10,
      note: 'Overdraft issue attempt'
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('INSUFFICIENT_STOCK')
      expect(result.message).toContain('Stok tidak mencukupi')
    }
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('should execute record_stock_movement RPC with exact parameters on valid input', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValue({
      user: validAdminUser,
      profile: validAdminProfile
    })

    const rpcMock = vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          movement_id: '99999999-9999-4999-a999-999999999999',
          product_id: validProductId,
          type: 'IN',
          quantity: 15,
          stock_before: 10,
          stock_after: 25,
          note: 'Batch penerimaan supplier resmi'
        }
      },
      error: null
    })

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: validProductId, name: 'Sample Item', sku: 'SMP-01', stock: 10 },
              error: null
            })
          })
        })
      }),
      rpc: rpcMock
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)

    const result = await recordStockMovementAction({
      productId: validProductId,
      type: 'IN',
      quantity: 15,
      note: 'Batch penerimaan supplier resmi'
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.stock_before).toBe(10)
      expect(result.data.stock_after).toBe(25)
      expect(result.data.quantity).toBe(15)
    }

    expect(rpcMock).toHaveBeenCalledTimes(1)
    expect(rpcMock).toHaveBeenCalledWith('record_stock_movement', {
      p_product_id: validProductId,
      p_type: 'IN',
      p_quantity: 15,
      p_note: 'Batch penerimaan supplier resmi'
    })
  })

  it('should handle structured RPC business failure without throwing', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValue({
      user: validAdminUser,
      profile: validAdminProfile
    })

    // Simulate RPC returning { success: false, error: 'INSUFFICIENT_STOCK' } with error: null
    const rpcMock = vi.fn().mockResolvedValue({
      data: {
        success: false,
        error: 'INSUFFICIENT_STOCK',
        message: 'Insufficient stock. Available: 2, Requested: 10'
      },
      error: null
    })

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: validProductId, name: 'Sample Item', sku: 'SMP-01', stock: 20 },
              error: null
            })
          })
        })
      }),
      rpc: rpcMock
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)

    const result = await recordStockMovementAction({
      productId: validProductId,
      type: 'OUT',
      quantity: 10,
      note: 'Concurrency conflict occurred'
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('INSUFFICIENT_STOCK')
      expect(result.message).toContain('Insufficient stock')
    }
  })
})
