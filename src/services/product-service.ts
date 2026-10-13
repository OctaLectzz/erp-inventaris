import { calculateInventorySummary, LOW_STOCK_THRESHOLD } from '@/services/inventory-domain'
import { toProduct } from '@/types/inventory'

import type { Database, ProductRow } from '@/types/database'
import type { InventorySummary, Product, ProductCatalogFilter } from '@/types/inventory'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface InventoryDashboardData {
  summary: InventorySummary
  lowStockProducts: Product[]
  totalCount: number
}

/**
 * Retrieves live inventory metrics and products for the dashboard canvas.
 * Guaranteed to compute high-level summary KPIs via pure domain calculation.
 */
export async function getInventoryDashboardData(supabase: SupabaseClient<Database>): Promise<InventoryDashboardData> {
  const { data: rows, error } = await supabase.from('products').select('*').order('name', { ascending: true })

  if (error) {
    throw new Error(`Failed to load inventory dashboard data: ${error.message}`)
  }

  const products: Product[] = ((rows as ProductRow[]) || []).map(toProduct)

  // Pure domain KPI calculations
  const summaryResult = calculateInventorySummary(products)

  // Identify low-stock items strictly where stock < LOW_STOCK_THRESHOLD (0..4)
  const lowStockProducts = products.filter((p) => p.stock < LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name))

  return {
    summary: summaryResult,
    lowStockProducts,
    totalCount: products.length
  }
}

/**
 * Retrieves the full or filtered product catalog for the inventory table.
 */
export async function getInventoryCatalogData(supabase: SupabaseClient<Database>, filters?: ProductCatalogFilter): Promise<Product[]> {
  let query = supabase.from('products').select('*').order('created_at', { ascending: false })

  // Apply optional category filter at SQL level when specified
  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }

  const { data: rows, error } = await query

  if (error) {
    throw new Error(`Failed to load inventory catalog: ${error.message}`)
  }

  let products: Product[] = ((rows as ProductRow[]) || []).map(toProduct)

  // In-memory multi-attribute search filter (SKU and Name)
  if (filters?.search && filters.search.trim().length > 0) {
    const q = filters.search.trim().toLowerCase()
    products = products.filter((p) => p.sku.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
  }

  // Stock health status filter
  if (filters?.stockStatus === 'low_stock') {
    products = products.filter((p) => p.stock < LOW_STOCK_THRESHOLD)
  } else if (filters?.stockStatus === 'normal') {
    products = products.filter((p) => p.stock >= LOW_STOCK_THRESHOLD)
  }

  return products
}

/**
 * Retrieves distinct product categories available in the inventory catalog.
 */
export async function getCatalogCategories(supabase: SupabaseClient<Database>): Promise<string[]> {
  const { data: rows, error } = await supabase.from('products').select('category')

  if (error) {
    throw new Error(`Failed to load product categories: ${error.message}`)
  }

  const categorySet = new Set<string>()
  for (const row of rows || []) {
    if (row.category && typeof row.category === 'string') {
      categorySet.add(row.category.trim())
    }
  }

  return Array.from(categorySet).sort((a, b) => a.localeCompare(b))
}
