'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { batchStockMutationSchema, stockMutationInputSchema } from '@/schemas/inventory-schema'
import { requireAuth } from '@/services/auth-service'
import { canMutateStock } from '@/types/auth'

import type { BatchStockMutationInput, StockMutationInput } from '@/schemas/inventory-schema'
import type { BatchStockMutationSuccessData, StockMutationSuccessData } from '@/types/inventory'

export type StockActionResult<T = StockMutationSuccessData> =
  { success: true; data: T } | { success: false; error: string; message: string; fieldErrors?: Record<string, string> }

interface RpcResultEnvelope<T = StockMutationSuccessData> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

/**
 * Server Action for executing a single atomic inventory mutation (Stock IN or Stock OUT).
 *
 * CRITICAL SECURITY & INVARIANTS:
 * 1. Restricted to roles with mutation authority ('administrator', 'staff_gudang', 'admin_gudang').
 * 2. Authenticates with caller's Supabase session (never service_role).
 * 3. Validates input schema strictly with stockMutationInputSchema.
 * 4. Invokes the atomic public.record_stock_movement RPC function with pessimistic row lock.
 * 5. Revalidates dashboard, catalog, and movement history pages on success.
 */
export async function recordStockMovementAction(input: StockMutationInput, locale = 'id'): Promise<StockActionResult<StockMutationSuccessData>> {
  // 1. Authoritative server-side authentication & RBAC check
  let profile
  try {
    const authContext = await requireAuth(locale)
    profile = authContext.profile
  } catch {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Sesi Anda tidak valid atau telah berakhir. Silakan masuk kembali.'
    }
  }

  if (!canMutateStock(profile.role)) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya peran Administrator dan Staf Gudang yang memiliki izin untuk melakukan mutasi stok.'
    }
  }

  // 2. Validate input schema
  const parsed = stockMutationInputSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string') {
        fieldErrors[field] = issue.message
      }
    }
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Data mutasi stok tidak valid. Mohon periksa kembali kolom input.',
      fieldErrors
    }
  }

  const { productId, type, quantity, note } = parsed.data
  const sanitizedNote = note.trim()

  try {
    const supabase = await createClient()

    // 3. Pre-flight check: ensure target product exists and has sufficient stock for OUT
    const { data: targetProduct, error: productQueryError } = await supabase
      .from('products')
      .select('id, name, sku, stock')
      .eq('id', productId)
      .maybeSingle()

    if (productQueryError) {
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: `Gagal memverifikasi produk: ${productQueryError.message}`
      }
    }

    if (!targetProduct) {
      return {
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: 'Produk yang dipilih tidak ditemukan dalam katalog gudang.'
      }
    }

    if (type === 'OUT' && quantity > targetProduct.stock) {
      return {
        success: false,
        error: 'INSUFFICIENT_STOCK',
        message: `Stok tidak mencukupi untuk mutasi keluar. Stok tersedia: ${targetProduct.stock}, Kuantitas diminta: ${quantity}.`
      }
    }

    // 4. Invoke atomic RPC function using caller's authenticated Supabase client
    const { data: rpcResponse, error: rpcError } = await supabase.rpc('record_stock_movement', {
      p_product_id: productId,
      p_type: type,
      p_quantity: quantity,
      p_note: sanitizedNote
    })

    if (rpcError) {
      return {
        success: false,
        error: rpcError.code || 'RPC_ERROR',
        message: rpcError.message || 'Gagal memproses mutasi stok di database.'
      }
    }

    const envelope = rpcResponse as unknown as RpcResultEnvelope<StockMutationSuccessData>
    if (!envelope || envelope.success !== true || !envelope.data) {
      return {
        success: false,
        error: envelope?.error || 'MUTATION_FAILED',
        message: envelope?.message || 'Gagal merekam mutasi stok pada basis data.'
      }
    }

    // 5. Revalidate affected pages to refresh live inventory counts
    revalidatePath(`/${locale}/dashboard`)
    revalidatePath(`/${locale}/inventory`)
    revalidatePath(`/${locale}/movements`)
    revalidatePath(`/${locale}/transactions`)
    revalidatePath('/dashboard')
    revalidatePath('/inventory')
    revalidatePath('/movements')
    revalidatePath('/transactions')

    return {
      success: true,
      data: envelope.data
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan sistem internal'
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: errorMessage
    }
  }
}

/**
 * Server Action for executing an atomic multi-item stock mutation transaction (Batch 2).
 *
 * CRITICAL SECURITY & ALL-OR-NOTHING INVARIANTS:
 * 1. Restricted to roles with mutation authority ('administrator', 'staff_gudang', 'admin_gudang').
 * 2. Authenticates with caller's Supabase session (never service_role).
 * 3. Validates batch items schema with batchStockMutationSchema (1-100 items, unique IDs).
 * 4. Invokes the atomic public.record_batch_stock_movements RPC function with ordered row locks.
 * 5. Revalidates dashboard, catalog, movement history, and transaction pages on success.
 */
export async function recordBatchStockMovementAction(
  input: BatchStockMutationInput,
  locale = 'id'
): Promise<StockActionResult<BatchStockMutationSuccessData>> {
  // 1. Authoritative server-side authentication & RBAC check
  let profile
  try {
    const authContext = await requireAuth(locale)
    profile = authContext.profile
  } catch {
    return {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Sesi Anda tidak valid atau telah berakhir. Silakan masuk kembali.'
    }
  }

  if (!canMutateStock(profile.role)) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya peran Administrator dan Staf Gudang yang memiliki izin untuk melakukan transaksi mutasi stok.'
    }
  }

  // 2. Validate input schema
  const parsed = batchStockMutationSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field === 'string') {
        fieldErrors[field] = issue.message
      }
    }
    return {
      success: false,
      error: 'VALIDATION_ERROR',
      message: 'Data transaksi stok multi-item tidak valid. Mohon periksa kembali kolom input.',
      fieldErrors
    }
  }

  const { type, items, note } = parsed.data
  const sanitizedNote = note.trim()

  try {
    const supabase = await createClient()

    // 3. Pre-flight check: verify all requested products exist and check stock for OUT
    const productIds = items.map((i) => i.productId)
    const { data: dbProducts, error: productsError } = await supabase.from('products').select('id, name, sku, stock').in('id', productIds)

    if (productsError) {
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: `Gagal memverifikasi produk katalog: ${productsError.message}`
      }
    }

    const dbProductsMap = new Map((dbProducts || []).map((p) => [p.id, p]))

    for (const item of items) {
      const found = dbProductsMap.get(item.productId)
      if (!found) {
        return {
          success: false,
          error: 'PRODUCT_NOT_FOUND',
          message: `Produk dengan ID ${item.productId} tidak ditemukan dalam katalog.`
        }
      }

      if (type === 'OUT' && item.quantity > found.stock) {
        return {
          success: false,
          error: 'INSUFFICIENT_STOCK',
          message: `Stok tidak mencukupi untuk ${found.name} (SKU: ${found.sku}). Stok tersedia: ${found.stock}, diminta: ${item.quantity}.`
        }
      }
    }

    // 4. Invoke atomic batch RPC function in PostgreSQL
    const { data: rpcResponse, error: rpcError } = await supabase.rpc('record_batch_stock_movements', {
      p_type: type,
      p_items: items.map((item) => ({ product_id: item.productId, quantity: item.quantity })),
      p_note: sanitizedNote
    })

    if (rpcError) {
      return {
        success: false,
        error: rpcError.code || 'RPC_ERROR',
        message: rpcError.message || 'Gagal memproses transaksi stok multi-item pada basis data.'
      }
    }

    const envelope = rpcResponse as unknown as RpcResultEnvelope<BatchStockMutationSuccessData>
    if (!envelope || envelope.success !== true || !envelope.data) {
      return {
        success: false,
        error: envelope?.error || 'MUTATION_FAILED',
        message: envelope?.message || 'Gagal merekam transaksi mutasi stok pada basis data.'
      }
    }

    // 5. Revalidate affected pages to refresh live inventory counts
    revalidatePath(`/${locale}/dashboard`)
    revalidatePath(`/${locale}/inventory`)
    revalidatePath(`/${locale}/movements`)
    revalidatePath(`/${locale}/transactions`)
    revalidatePath('/dashboard')
    revalidatePath('/inventory')
    revalidatePath('/movements')
    revalidatePath('/transactions')

    return {
      success: true,
      data: envelope.data
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan sistem internal'
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: errorMessage
    }
  }
}
