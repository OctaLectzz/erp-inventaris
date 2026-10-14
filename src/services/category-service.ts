import type { Database } from '@/types/database'
import type { Category } from '@/types/inventory'
import type { SupabaseClient } from '@supabase/supabase-js'

interface RawCategoryRow {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
  updated_at: string
  products?: { count: number }[] | { count: number }
}

export function toCategory(row: RawCategoryRow): Category {
  let count = 0
  if (row.products) {
    if (Array.isArray(row.products) && row.products[0]) {
      count = row.products[0].count
    } else if (!Array.isArray(row.products) && typeof row.products.count === 'number') {
      count = row.products.count
    }
  }

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    productCount: count,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Retrieve all product categories ordered by name with associated product counts.
 */
export async function getCategories(supabase: SupabaseClient<Database>): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*, products(count)').order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  return (data || []).map((row) => toCategory(row as unknown as RawCategoryRow))
}

/**
 * Retrieve a single category by its UUID.
 */
export async function getCategoryById(supabase: SupabaseClient<Database>, id: string): Promise<Category | null> {
  const { data, error } = await supabase.from('categories').select('*, products(count)').eq('id', id).maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch category by ID: ${error.message}`)
  }

  if (!data) return null
  return toCategory(data as unknown as RawCategoryRow)
}

/**
 * Retrieve a single category by its slug.
 */
export async function getCategoryBySlug(supabase: SupabaseClient<Database>, slug: string): Promise<Category | null> {
  const { data, error } = await supabase.from('categories').select('*, products(count)').eq('slug', slug).maybeSingle()

  if (error) {
    throw new Error(`Failed to fetch category by slug: ${error.message}`)
  }

  if (!data) return null
  return toCategory(data as unknown as RawCategoryRow)
}
