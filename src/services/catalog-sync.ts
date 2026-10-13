import type { Database } from '@/types/database'
import type { CatalogSyncResult, DummyJsonProduct, DummyJsonResponse } from '@/types/inventory'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Assumed fixed conversion exchange rate: 1 USD = 16,000 IDR.
 * NOTE: This is a fixed engineering baseline assumption specified in the project PRD/database docs,
 * NOT a live fluctuating currency market rate.
 */
export const PROJECT_FIXED_USD_TO_IDR_RATE = 16_000

export interface SyncCatalogOptions {
  limit?: number
  defaultStockForNew?: number
  useDummyJsonStockForNew?: boolean
}

/**
 * Generates a clean, deterministic, unique SKU from product attributes.
 * Falls back to category and ID formatting if DummyJSON sku is absent.
 */
export function generateDeterministicSku(product: DummyJsonProduct): string {
  if (product.sku && product.sku.trim().length > 0) {
    return product.sku.trim().toUpperCase()
  }

  const categoryPrefix = product.category
    .replace(/[^a-zA-Z0-9]/g, '')
    .slice(0, 4)
    .toUpperCase()
    .padEnd(3, 'X')

  const idSuffix = String(product.id).padStart(3, '0')
  return `${categoryPrefix}-${idSuffix}`
}

/**
 * Converts USD price to integer IDR according to the fixed project assumption.
 */
export function convertUsdToIdr(usdPrice: number): number {
  if (usdPrice < 0 || !Number.isFinite(usdPrice)) {
    return 0
  }
  return Math.round(usdPrice * PROJECT_FIXED_USD_TO_IDR_RATE)
}

/**
 * Fetches product catalog from DummyJSON via native fetch.
 */
export async function fetchDummyJsonCatalog(limit: number = 30): Promise<DummyJsonProduct[]> {
  const url = `https://dummyjson.com/products?limit=${limit}`
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch DummyJSON catalog: HTTP ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as DummyJsonResponse
  if (!Array.isArray(data.products)) {
    throw new Error('Invalid DummyJSON response structure: products array missing')
  }

  return data.products
}

/**
 * Synchronizes the catalog from DummyJSON into the Supabase database.
 *
 * GUARANTEES:
 * 1. Deterministic SKUs ensure idempotency; re-running will NOT create duplicate products.
 * 2. Operational stock of existing products is NEVER overwritten by metadata synchronization.
 * 3. Validation is performed prior to database mutation.
 */
export async function syncCatalogFromDummyJson(supabase: SupabaseClient<Database>, options: SyncCatalogOptions = {}): Promise<CatalogSyncResult> {
  const limit = options.limit ?? 30
  const useDummyJsonStock = options.useDummyJsonStockForNew ?? true
  const fallbackStock = options.defaultStockForNew ?? 0

  const products = await fetchDummyJsonCatalog(limit)

  const result: CatalogSyncResult = {
    totalFetched: products.length,
    insertedCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    errors: []
  }

  // Fetch all existing products to check for presence and protect operational stock
  const { data: existingRows, error: fetchError } = await supabase.from('products').select('id, sku, stock')

  if (fetchError) {
    throw new Error(`Failed to query existing products: ${fetchError.message}`)
  }

  // Map lowercase SKU -> existing product
  const existingMap = new Map<string, { id: string; stock: number }>()
  for (const row of existingRows || []) {
    existingMap.set(row.sku.toLowerCase(), { id: row.id, stock: row.stock })
  }

  for (const rawProduct of products) {
    try {
      const sku = generateDeterministicSku(rawProduct)
      const name = rawProduct.title?.trim()
      const category = rawProduct.category?.trim() || 'general'
      const price = convertUsdToIdr(rawProduct.price)
      const description = rawProduct.description?.trim() || null
      const imageUrl = rawProduct.thumbnail || (rawProduct.images && rawProduct.images[0]) || null
      const unit = 'pcs'

      // Validation
      if (!name || name.length === 0) {
        result.skippedCount++
        result.errors.push(`Skipped product ID ${rawProduct.id}: missing name`)
        continue
      }

      if (price < 0) {
        result.skippedCount++
        result.errors.push(`Skipped product ID ${rawProduct.id}: invalid price`)
        continue
      }

      const existing = existingMap.get(sku.toLowerCase())

      if (existing) {
        // Metadata update ONLY — NEVER touch existing operational stock!
        const { error: updateError } = await supabase
          .from('products')
          .update({
            name,
            category,
            unit,
            price,
            description,
            image_url: imageUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (updateError) {
          result.errors.push(`Failed to update ${sku}: ${updateError.message}`)
        } else {
          result.updatedCount++
        }
      } else {
        // Insert new product
        const initialStock = useDummyJsonStock ? Math.max(0, Math.floor(rawProduct.stock || 0)) : fallbackStock

        const { error: insertError } = await supabase.from('products').insert({
          sku,
          name,
          category,
          unit,
          price,
          stock: initialStock,
          description,
          image_url: imageUrl
        })

        if (insertError) {
          result.errors.push(`Failed to insert ${sku}: ${insertError.message}`)
        } else {
          result.insertedCount++
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      result.errors.push(`Unexpected error for product ${rawProduct.id}: ${msg}`)
    }
  }

  return result
}
