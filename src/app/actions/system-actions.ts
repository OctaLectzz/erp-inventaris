'use server'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/services/auth-service'
import { syncCatalogFromDummyJson } from '@/services/catalog-sync'
import { canManageCatalog } from '@/types/auth'

import type { CatalogSyncResult } from '@/types/inventory'

export type SystemActionResult<T = CatalogSyncResult> =
  { success: true; data: T; message: string } | { success: false; error: string; message: string }

/**
 * Server Action for Administrator to synchronize or reset catalog products from DummyJSON.
 * Adheres to Modul B: "sediakan cara reset data demo".
 */
export async function syncDummyJsonCatalogAction(locale: string = 'id'): Promise<SystemActionResult<CatalogSyncResult>> {
  try {
    const { profile } = await requireAuth(locale)

    if (!canManageCatalog(profile.role)) {
      return {
        success: false,
        error: 'FORBIDDEN',
        message: 'Hanya Administrator yang memiliki wewenang untuk menyinkronkan atau me-reset katalog demo.'
      }
    }

    const adminSupabase = createAdminClient()
    const syncResult = await syncCatalogFromDummyJson(adminSupabase, {
      limit: 30,
      useDummyJsonStockForNew: true
    })

    revalidatePath(`/${locale}/inventory`)
    revalidatePath(`/${locale}/dashboard`)
    revalidatePath(`/${locale}/reports`)

    return {
      success: true,
      data: syncResult,
      message: `Sinkronisasi katalog DummyJSON berhasil (${syncResult.totalFetched} diambil, ${syncResult.insertedCount} baru, ${syncResult.updatedCount} diperbarui).`
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Gagal menyinkronkan katalog produk dari DummyJSON.'
    return {
      success: false,
      error: 'SYNC_FAILED',
      message
    }
  }
}
