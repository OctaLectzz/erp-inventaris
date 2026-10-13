'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { stockMutationInputSchema } from '@/schemas/inventory-schema'
import { requireAuth } from '@/services/auth-service'

import type { StockMutationInput } from '@/schemas/inventory-schema'
import type { StockMutationSuccessData } from '@/types/inventory'

export type StockActionResult<T = StockMutationSuccessData> =
  { success: true; data: T } | { success: false; error: string; message: string; fieldErrors?: Record<string, string> }

interface RpcResultEnvelope {
  success: boolean
  data?: StockMutationSuccessData
  error?: string
  message?: string
}

/**
 * Server Action for executing an atomic inventory mutation (Stock IN or Stock OUT).
 *
 * CRITICAL SECURITY & INVARIANTS:
 * 1. Strictly restricted to 'admin_gudang' role on the server boundary.
 * 2. Authenticates with caller's Supabase session (never service_role).
 * 3. Validates input schema strictly with stockMutationInputSchema.
 * 4. Invokes the atomic public.record_stock_movement RPC function with pessimistic row lock.
 * 5. Revalidates dashboard, catalog, and movement history pages on success.
 */
export async function recordStockMovementAction(input: StockMutationInput, locale = 'id'): Promise<StockActionResult> {
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

  if (profile.role !== 'admin_gudang') {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya peran Admin Gudang yang memiliki izin untuk melakukan mutasi stok.'
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

    const envelope = rpcResponse as unknown as RpcResultEnvelope
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
    revalidatePath('/dashboard')
    revalidatePath('/inventory')
    revalidatePath('/movements')

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
