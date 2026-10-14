import { beforeEach, describe, expect, it, vi } from 'vitest'

import { recordBatchStockMovementAction } from '@/app/actions/stock-actions'
import * as supabaseServer from '@/lib/supabase/server'
import * as authService from '@/services/auth-service'

import type { Database } from '@/types/database'
import type { SupabaseClient, User } from '@supabase/supabase-js'

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn()
}))

describe('Batch Stock Mutation Action Unit Tests', () => {
  const validAdminUser = { id: 'edca6478-3197-4f48-ab94-6bd81d233a26' } as unknown as User
  const validAdminProfile = {
    id: 'edca6478-3197-4f48-ab94-6bd81d233a26',
    email: 'admin@inventra.demo',
    fullName: 'Administrator Demo',
    role: 'administrator' as const,
    createdAt: '',
    updatedAt: ''
  }

  const validStaffUser = { id: '888af939-5849-4830-816a-7ccbe615ce86' } as unknown as User
  const validStaffProfile = {
    id: '888af939-5849-4830-816a-7ccbe615ce86',
    email: 'staff@inventra.demo',
    fullName: 'Staf Gudang Demo',
    role: 'staff_gudang' as const,
    createdAt: '',
    updatedAt: ''
  }

  const validAuditorUser = { id: '6cefc54f-cd78-4ca5-8702-cfba44dda68f' } as unknown as User
  const validAuditorProfile = {
    id: '6cefc54f-cd78-4ca5-8702-cfba44dda68f',
    email: 'owner@inventra.demo',
    fullName: 'Auditor Demo',
    role: 'auditor' as const,
    createdAt: '',
    updatedAt: ''
  }

  const product1Id = '11111111-1111-4111-8111-111111111111'
  const product2Id = '22222222-2222-4222-8222-222222222222'

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('rejects unauthenticated caller with UNAUTHORIZED error', async () => {
    vi.spyOn(authService, 'requireAuth').mockRejectedValue(new Error('NEXT_REDIRECT'))

    const result = await recordBatchStockMovementAction({
      type: 'IN',
      note: 'Supplier delivery batch',
      items: [{ productId: product1Id, quantity: 10 }]
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('UNAUTHORIZED')
    }
  })

  it('strictly rejects auditor caller with FORBIDDEN error (Least Privilege)', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValue({
      user: validAuditorUser,
      profile: validAuditorProfile
    })

    const result = await recordBatchStockMovementAction({
      type: 'IN',
      note: 'Auditor attempting batch mutation',
      items: [{ productId: product1Id, quantity: 10 }]
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('FORBIDDEN')
    }
  })

  it('authorizes staff_gudang caller to execute batch transaction', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValue({
      user: validStaffUser,
      profile: validStaffProfile
    })

    const rpcMock = vi.fn().mockResolvedValue({
      data: {
        success: true,
        data: {
          batch_id: '33333333-3333-4333-8333-333333333333',
          type: 'IN',
          note: 'Penerimaan kontainer mingguan',
          items_count: 2,
          movements: []
        }
      },
      error: null
    })

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              { id: product1Id, name: 'Product 1', sku: 'P1', stock: 10 },
              { id: product2Id, name: 'Product 2', sku: 'P2', stock: 20 }
            ],
            error: null
          })
        })
      }),
      rpc: rpcMock
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)

    const result = await recordBatchStockMovementAction({
      type: 'IN',
      note: 'Penerimaan kontainer mingguan',
      items: [
        { productId: product1Id, quantity: 15 },
        { productId: product2Id, quantity: 25 }
      ]
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.items_count).toBe(2)
    }
    expect(rpcMock).toHaveBeenCalledWith('record_batch_stock_movements', {
      p_type: 'IN',
      p_items: [
        { product_id: product1Id, quantity: 15 },
        { product_id: product2Id, quantity: 25 }
      ],
      p_note: 'Penerimaan kontainer mingguan'
    })
  })

  it('rejects batch OUT transaction if any single item has insufficient stock (All-or-Nothing check)', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValue({
      user: validAdminUser,
      profile: validAdminProfile
    })

    const rpcMock = vi.fn()
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [
              { id: product1Id, name: 'Product 1', sku: 'P1', stock: 100 },
              { id: product2Id, name: 'Product 2', sku: 'P2', stock: 5 } // Only 5 in stock!
            ],
            error: null
          })
        })
      }),
      rpc: rpcMock
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)

    // Requesting 10 from product1 (OK) and 20 from product2 (FAIL)
    const result = await recordBatchStockMovementAction({
      type: 'OUT',
      note: 'Distribusi pesanan toko cabang',
      items: [
        { productId: product1Id, quantity: 10 },
        { productId: product2Id, quantity: 20 }
      ]
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('INSUFFICIENT_STOCK')
      expect(result.message).toContain('Stok tidak mencukupi untuk Product 2')
    }
    // RPC MUST NOT be called if pre-check fails
    expect(rpcMock).not.toHaveBeenCalled()
  })

  it('rejects batch if any target product does not exist in catalog', async () => {
    vi.spyOn(authService, 'requireAuth').mockResolvedValue({
      user: validAdminUser,
      profile: validAdminProfile
    })

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue({
            data: [{ id: product1Id, name: 'Product 1', sku: 'P1', stock: 10 }],
            error: null
          })
        })
      }),
      rpc: vi.fn()
    }

    vi.spyOn(supabaseServer, 'createClient').mockResolvedValue(mockSupabase as unknown as SupabaseClient<Database>)

    const result = await recordBatchStockMovementAction({
      type: 'IN',
      note: 'Receiving missing item',
      items: [
        { productId: product1Id, quantity: 10 },
        { productId: product2Id, quantity: 5 } // product2Id is not in returned data!
      ]
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toBe('PRODUCT_NOT_FOUND')
    }
  })
})
