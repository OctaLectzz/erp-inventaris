import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

import { syncCatalogFromDummyJson } from '../src/services/catalog-sync'

import type { Database } from '../src/types/database'

function loadEnvLocal(): void {
  const envPath = path.resolve(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) return

  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim()
      let val = trimmed.slice(eqIdx + 1).trim()
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1)
      }
      if (!process.env[key]) {
        process.env[key] = val
      }
    }
  }
}

async function main(): Promise<void> {
  loadEnvLocal()

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('Error: Supabase credentials not found in environment.')
    process.exit(1)
  }

  const supabase = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  console.log('--- Inventra Catalog Synchronization from DummyJSON ---')
  console.log('Target URL:', supabaseUrl)
  console.log('Fetching and synchronizing 30 products...')

  const syncResult = await syncCatalogFromDummyJson(supabase, {
    limit: 30,
    useDummyJsonStockForNew: true
  })

  console.log('\nSync Result Summary:')
  console.log(`  Total Fetched:  ${syncResult.totalFetched}`)
  console.log(`  Inserted:       ${syncResult.insertedCount}`)
  console.log(`  Updated:        ${syncResult.updatedCount}`)
  console.log(`  Skipped:        ${syncResult.skippedCount}`)
  console.log(`  Errors:         ${syncResult.errors.length}`)

  if (syncResult.errors.length > 0) {
    console.warn('Sync Errors:')
    syncResult.errors.forEach((e) => console.warn(`  - ${e}`))
  }

  // Verification queries
  const { data: products, error: queryError } = await supabase
    .from('products')
    .select('id, sku, name, category, price, stock')
    .order('created_at', { ascending: true })

  if (queryError || !products) {
    console.error('Failed to verify products:', queryError?.message)
    process.exit(1)
  }

  console.log(`\nDatabase Verification:`)
  console.log(`  Total products in database: ${products.length}`)

  // Duplicate SKU check
  const skuCounts = new Map<string, number>()
  for (const p of products) {
    const key = p.sku.toLowerCase()
    skuCounts.set(key, (skuCounts.get(key) || 0) + 1)
  }

  const duplicates = Array.from(skuCounts.entries()).filter(([, count]) => count > 1)
  console.log(`  Duplicate SKUs: ${duplicates.length}`)
  if (duplicates.length > 0) {
    console.error('  DUPLICATE SKUS DETECTED:', duplicates)
  }

  // Summary numbers
  const totalStock = products.reduce((acc, p) => acc + p.stock, 0)
  const totalValue = products.reduce((acc, p) => acc + p.price * p.stock, 0)
  const lowStock = products.filter((p) => p.stock < 5).length

  console.log(`  Total Inventory Units: ${totalStock}`)
  console.log(`  Total Inventory Value: Rp ${totalValue.toLocaleString('id-ID')}`)
  console.log(`  Low Stock Count (< 5 units): ${lowStock}`)
  console.log('\nSample Products (first 3):')
  products.slice(0, 3).forEach((p) => {
    console.log(`  - [${p.sku}] ${p.name} (${p.category}) | Rp ${p.price.toLocaleString('id-ID')} | Stock: ${p.stock}`)
  })
}

main().catch((err) => {
  console.error('Fatal catalog sync error:', err)
  process.exit(1)
})
