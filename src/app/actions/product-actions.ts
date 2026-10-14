'use server'

import { revalidatePath } from 'next/cache'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { productCatalogInputSchema, productCatalogUpdateSchema } from '@/schemas/inventory-schema'
import { requireAuth } from '@/services/auth-service'
import { canManageCatalog } from '@/types/auth'
import { toProduct } from '@/types/inventory'

import type { ProductCatalogInput, ProductCatalogUpdate } from '@/schemas/inventory-schema'
import type { Product } from '@/types/inventory'

export type ProductActionResult<T = Product> =
  { success: true; data: T } | { success: false; error: string; message: string; fieldErrors?: Record<string, string> }

/**
 * Server Action for creating a new catalog product.
 *
 * SECURITY & INVARIANTS:
 * 1. Strictly restricted to 'admin_gudang' role.
 * 2. Payload is validated with productCatalogInputSchema which completely omits stock.
 * 3. Initial stock is set to 0 by database default, satisfying trigger & privileges.
 * 4. Verifies SKU uniqueness prior to insertion.
 */
export async function createProductAction(input: ProductCatalogInput, locale = 'id'): Promise<ProductActionResult> {
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

  if (!canManageCatalog(profile.role)) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya peran Administrator yang memiliki izin untuk menambahkan produk baru.'
    }
  }

  // 2. Validate input schema
  const parsed = productCatalogInputSchema.safeParse(input)
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
      message: 'Data produk tidak valid. Mohon periksa kembali kolom input.',
      fieldErrors
    }
  }

  const { sku, name, category, categoryId, unit, price, description, imageUrl } = parsed.data
  const sanitizedSku = sku.toUpperCase()

  try {
    const supabase = await createClient()

    // 3. Check for SKU collision (case-insensitive)
    const { data: existingSku } = await supabase.from('products').select('id').ilike('sku', sanitizedSku).maybeSingle()

    if (existingSku) {
      return {
        success: false,
        error: 'DUPLICATE_SKU',
        message: 'Kode SKU ini sudah terdaftar dalam sistem. Gunakan kode SKU yang berbeda.',
        fieldErrors: { sku: 'skuDuplicate' }
      }
    }

    // Resolve category_id if not directly passed
    let resolvedCategoryId = categoryId || null
    if (!resolvedCategoryId && category) {
      const { data: matchedCat } = await supabase.from('categories').select('id').ilike('name', category.trim()).maybeSingle()
      if (matchedCat) {
        resolvedCategoryId = matchedCat.id
      }
    }

    // 4. Insert catalog metadata strictly without passing stock
    const { data: insertedRow, error: insertError } = await supabase
      .from('products')
      .insert({
        sku: sanitizedSku,
        name,
        category,
        category_id: resolvedCategoryId,
        unit,
        price,
        description: description || null,
        image_url: imageUrl || null
      })
      .select()
      .single()

    if (insertError || !insertedRow) {
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: insertError?.message || 'Gagal menambahkan produk ke katalog.'
      }
    }

    revalidatePath(`/${locale}/dashboard`)
    revalidatePath(`/${locale}/inventory`)

    return {
      success: true,
      data: toProduct(insertedRow)
    }
  } catch (err) {
    console.error('Error in createProductAction:', err)
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan sistem saat menyimpan produk. Silakan coba kembali.'
    }
  }
}

/**
 * Server Action for updating an existing catalog product.
 *
 * SECURITY & INVARIANTS:
 * 1. Strictly restricted to 'admin_gudang' role.
 * 2. Payload is validated with productCatalogUpdateSchema (strictly excludes stock).
 * 3. Only metadata (sku, name, category, unit, price, description, image_url) is updated.
 * 4. Existing operational stock is never modified or overwritten.
 */
export async function updateProductAction(input: ProductCatalogUpdate, locale = 'id'): Promise<ProductActionResult> {
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

  if (!canManageCatalog(profile.role)) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya peran Administrator yang memiliki izin untuk mengubah informasi produk.'
    }
  }

  // 2. Validate input schema
  const parsed = productCatalogUpdateSchema.safeParse(input)
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
      message: 'Data produk tidak valid. Mohon periksa kembali kolom input.',
      fieldErrors
    }
  }

  const { id, sku, name, category, categoryId, unit, price, description, imageUrl } = parsed.data
  const sanitizedSku = sku.toUpperCase()

  try {
    const supabase = await createClient()

    // 3. Check for SKU collision on other products
    const { data: existingSku } = await supabase.from('products').select('id').ilike('sku', sanitizedSku).neq('id', id).maybeSingle()

    if (existingSku) {
      return {
        success: false,
        error: 'DUPLICATE_SKU',
        message: 'Kode SKU ini sudah digunakan oleh produk lain.',
        fieldErrors: { sku: 'skuDuplicate' }
      }
    }

    // Resolve category_id if not directly passed
    let resolvedCategoryId = categoryId || null
    if (!resolvedCategoryId && category) {
      const { data: matchedCat } = await supabase.from('categories').select('id').ilike('name', category.trim()).maybeSingle()
      if (matchedCat) {
        resolvedCategoryId = matchedCat.id
      }
    }

    // 4. Update metadata strictly — stock is NEVER updated
    const { data: updatedRow, error: updateError } = await supabase
      .from('products')
      .update({
        sku: sanitizedSku,
        name,
        category,
        category_id: resolvedCategoryId,
        unit,
        price,
        description: description || null,
        image_url: imageUrl || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updatedRow) {
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: updateError?.message || 'Gagal memperbarui informasi produk.'
      }
    }

    revalidatePath(`/${locale}/dashboard`)
    revalidatePath(`/${locale}/inventory`)

    return {
      success: true,
      data: toProduct(updatedRow)
    }
  } catch (err) {
    console.error('Error in updateProductAction:', err)
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan sistem saat memperbarui informasi produk. Silakan coba kembali.'
    }
  }
}

/**
 * Server Action to delete a product from catalog.
 * Strictly restricted to 'administrator' / 'admin_gudang' role.
 * Invariant: Prevents deletion if product has existing stock movements.
 */
export async function deleteProductAction(productId: string, locale = 'id'): Promise<ProductActionResult<{ id: string; name: string }>> {
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

  if (!canManageCatalog(profile.role)) {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya peran Administrator yang memiliki izin untuk menghapus produk.'
    }
  }

  if (!productId || typeof productId !== 'string') {
    return {
      success: false,
      error: 'INVALID_ID',
      message: 'ID produk tidak valid.'
    }
  }

  try {
    const supabase = await createClient()

    // 1. Check if product exists
    const { data: product, error: fetchError } = await supabase.from('products').select('id, name, sku, stock').eq('id', productId).maybeSingle()

    if (fetchError || !product) {
      return {
        success: false,
        error: 'PRODUCT_NOT_FOUND',
        message: 'Produk yang ingin dihapus tidak ditemukan dalam sistem.'
      }
    }

    // 2. Check for existing stock movement history (Foreign Key Integrity)
    const { count: movementCount } = await supabase.from('stock_movements').select('*', { count: 'exact', head: true }).eq('product_id', productId)

    if (movementCount && movementCount > 0) {
      return {
        success: false,
        error: 'HAS_MOVEMENTS',
        message: `Produk "${product.name}" (${product.sku}) tidak dapat dihapus karena sudah memiliki ${movementCount} catatan riwayat mutasi stok. Riwayat mutasi dilindungi untuk menjaga keabsahan buku besar audit inventaris.`
      }
    }

    // 3. Delete product safely (prefer admin client for defense-in-depth, fallback to authenticated client)
    let deleteError = null
    try {
      const admin = createAdminClient()
      const res = await admin.from('products').delete().eq('id', productId)
      deleteError = res.error
    } catch {
      const res = await supabase.from('products').delete().eq('id', productId)
      deleteError = res.error
    }

    if (deleteError) {
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: deleteError.message || 'Gagal menghapus produk dari basis data.'
      }
    }

    revalidatePath(`/${locale}/dashboard`)
    revalidatePath(`/${locale}/inventory`)
    revalidatePath(`/${locale}/reports`)

    return {
      success: true,
      data: { id: product.id, name: product.name }
    }
  } catch (err) {
    console.error('Error in deleteProductAction:', err)
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan sistem saat menghapus produk. Silakan coba kembali.'
    }
  }
}
