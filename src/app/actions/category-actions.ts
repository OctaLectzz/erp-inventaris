'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'
import { categoryInputSchema, categoryUpdateSchema } from '@/schemas/inventory-schema'
import { requireAuth } from '@/services/auth-service'
import { toCategory } from '@/services/category-service'

import type { CategoryInput, CategoryUpdate } from '@/schemas/inventory-schema'
import type { Category } from '@/types/inventory'

export type CategoryActionResult<T = Category> =
  { success: true; data: T } | { success: false; error: string; message: string; fieldErrors?: Record<string, string> }

/**
 * Server Action to create a new product category.
 * Strictly restricted to warehouse administrators.
 */
export async function createCategoryAction(input: CategoryInput, locale = 'id'): Promise<CategoryActionResult> {
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

  if (profile.role !== 'admin_gudang' && profile.role !== 'administrator') {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya peran Admin yang memiliki izin untuk menambahkan kategori baru.'
    }
  }

  const parsed = categoryInputSchema.safeParse(input)
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
      message: 'Data kategori tidak valid. Mohon periksa kembali kolom input.',
      fieldErrors
    }
  }

  const { name, slug, description } = parsed.data
  const sanitizedName = name.trim()
  const sanitizedSlug = slug.trim().toLowerCase()

  try {
    const supabase = await createClient()

    // Check for duplicate category name (case-insensitive)
    const { data: existingName } = await supabase.from('categories').select('id').ilike('name', sanitizedName).maybeSingle()

    if (existingName) {
      return {
        success: false,
        error: 'DUPLICATE_NAME',
        message: 'Nama kategori ini sudah terdaftar dalam sistem.',
        fieldErrors: { name: 'Nama kategori sudah digunakan' }
      }
    }

    // Check for duplicate slug
    const { data: existingSlug } = await supabase.from('categories').select('id').eq('slug', sanitizedSlug).maybeSingle()

    if (existingSlug) {
      return {
        success: false,
        error: 'DUPLICATE_SLUG',
        message: 'Slug kategori ini sudah terdaftar. Gunakan slug yang berbeda.',
        fieldErrors: { slug: 'Slug kategori sudah digunakan' }
      }
    }

    const { data: insertedRow, error: insertError } = await supabase
      .from('categories')
      .insert({
        name: sanitizedName,
        slug: sanitizedSlug,
        description: description?.trim() || null
      })
      .select('*, products(count)')
      .single()

    if (insertError || !insertedRow) {
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: insertError?.message || 'Gagal menambahkan kategori ke basis data.'
      }
    }

    revalidatePath(`/${locale}/categories`)
    revalidatePath(`/${locale}/inventory`)
    revalidatePath(`/${locale}/dashboard`)

    return {
      success: true,
      data: toCategory(insertedRow)
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menyimpan kategori'
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: errMsg
    }
  }
}

/**
 * Server Action to update an existing product category.
 * Strictly restricted to warehouse administrators.
 */
export async function updateCategoryAction(input: CategoryUpdate, locale = 'id'): Promise<CategoryActionResult> {
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

  if (profile.role !== 'admin_gudang' && profile.role !== 'administrator') {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya peran Admin yang memiliki izin untuk mengubah kategori.'
    }
  }

  const parsed = categoryUpdateSchema.safeParse(input)
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
      message: 'Data kategori tidak valid. Mohon periksa kembali kolom input.',
      fieldErrors
    }
  }

  const { id, name, slug, description } = parsed.data
  const sanitizedName = name.trim()
  const sanitizedSlug = slug.trim().toLowerCase()

  try {
    const supabase = await createClient()

    // Check for duplicate name collision on another category
    const { data: existingName } = await supabase.from('categories').select('id').ilike('name', sanitizedName).neq('id', id).maybeSingle()

    if (existingName) {
      return {
        success: false,
        error: 'DUPLICATE_NAME',
        message: 'Nama kategori ini sudah digunakan oleh kategori lain.',
        fieldErrors: { name: 'Nama kategori sudah digunakan' }
      }
    }

    // Check for duplicate slug collision on another category
    const { data: existingSlug } = await supabase.from('categories').select('id').eq('slug', sanitizedSlug).neq('id', id).maybeSingle()

    if (existingSlug) {
      return {
        success: false,
        error: 'DUPLICATE_SLUG',
        message: 'Slug kategori ini sudah digunakan oleh kategori lain.',
        fieldErrors: { slug: 'Slug kategori sudah digunakan' }
      }
    }

    const { data: updatedRow, error: updateError } = await supabase
      .from('categories')
      .update({
        name: sanitizedName,
        slug: sanitizedSlug,
        description: description?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*, products(count)')
      .single()

    if (updateError || !updatedRow) {
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: updateError?.message || 'Gagal memperbarui kategori.'
      }
    }

    revalidatePath(`/${locale}/categories`)
    revalidatePath(`/${locale}/inventory`)
    revalidatePath(`/${locale}/dashboard`)

    return {
      success: true,
      data: toCategory(updatedRow)
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat memperbarui kategori'
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: errMsg
    }
  }
}

/**
 * Server Action to delete a category.
 * Prevents deletion if products are currently associated with the category.
 */
export async function deleteCategoryAction(id: string, locale = 'id'): Promise<CategoryActionResult<null>> {
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

  if (profile.role !== 'admin_gudang' && profile.role !== 'administrator') {
    return {
      success: false,
      error: 'FORBIDDEN',
      message: 'Hanya peran Admin yang memiliki izin untuk menghapus kategori.'
    }
  }

  try {
    const supabase = await createClient()

    // Check if any products are associated with this category
    const { count, error: countError } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('category_id', id)

    if (countError) {
      return {
        success: false,
        error: 'DATABASE_ERROR',
        message: `Gagal memeriksa relasi produk: ${countError.message}`
      }
    }

    if (typeof count === 'number' && count > 0) {
      return {
        success: false,
        error: 'CATEGORY_IN_USE',
        message: `Kategori tidak dapat dihapus karena masih digunakan oleh ${count} produk dalam katalog gudang.`
      }
    }

    const { error: deleteError } = await supabase.from('categories').delete().eq('id', id)

    if (deleteError) {
      return {
        success: false,
        error: 'DELETE_FAILED',
        message: deleteError.message || 'Gagal menghapus kategori dari basis data.'
      }
    }

    revalidatePath(`/${locale}/categories`)
    revalidatePath(`/${locale}/inventory`)
    revalidatePath(`/${locale}/dashboard`)

    return {
      success: true,
      data: null
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menghapus kategori'
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: errMsg
    }
  }
}
