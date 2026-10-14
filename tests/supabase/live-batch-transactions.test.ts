import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Database } from '@/types/database'
import type { BatchStockMutationSuccessData } from '@/types/inventory'

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

loadEnvLocal()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminEmail = process.env.DEMO_ADMIN_EMAIL || 'admin@inventra.demo'
const adminPassword = process.env.DEMO_ADMIN_PASSWORD!
const staffEmail = process.env.DEMO_STAFF_EMAIL || 'staff@inventra.demo'
const staffPassword = process.env.DEMO_STAFF_PASSWORD!
const ownerEmail = process.env.DEMO_OWNER_EMAIL || 'owner@inventra.demo'
const ownerPassword = process.env.DEMO_OWNER_PASSWORD!

const hasLiveCredentials = Boolean(supabaseUrl && anonKey && serviceRoleKey && adminPassword && staffPassword && ownerPassword)

interface BatchRpcResponseEnvelope {
  success: boolean
  data?: BatchStockMutationSuccessData
  error?: string
  message?: string
}

describe.runIf(hasLiveCredentials)('Live Batch Stock Transactions & Atomic Guarantee Integration', () => {
  const adminServiceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  let adminClient: ReturnType<typeof createClient<Database>>
  let staffClient: ReturnType<typeof createClient<Database>>
  let auditorClient: ReturnType<typeof createClient<Database>>
  let anonClient: ReturnType<typeof createClient<Database>>

  let productAId: string
  let productBId: string
  const skuA = `BATCH-TEST-A-${Date.now()}`
  const skuB = `BATCH-TEST-B-${Date.now()}`

  beforeAll(async () => {
    anonClient = createClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    // 1. Authenticate Administrator
    adminClient = createClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    const { data: adminAuth, error: adminAuthErr } = await adminClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })
    if (adminAuthErr || !adminAuth.user) throw new Error(`Admin login failed: ${adminAuthErr?.message}`)

    // 2. Authenticate Staff Gudang
    staffClient = createClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    const { data: staffAuth, error: staffAuthErr } = await staffClient.auth.signInWithPassword({
      email: staffEmail,
      password: staffPassword
    })
    if (staffAuthErr || !staffAuth.user) throw new Error(`Staff login failed: ${staffAuthErr?.message}`)

    // 3. Authenticate Auditor
    auditorClient = createClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    const { data: auditorAuth, error: auditorAuthErr } = await auditorClient.auth.signInWithPassword({
      email: ownerEmail,
      password: ownerPassword
    })
    if (auditorAuthErr || !auditorAuth.user) throw new Error(`Auditor login failed: ${auditorAuthErr?.message}`)

    // 4. Create two test products via adminServiceClient
    const { data: pA, error: errA } = await adminServiceClient
      .from('products')
      .insert({
        sku: skuA,
        name: 'Batch Test Product Alpha',
        category: 'testing',
        price: 100_000,
        unit: 'pcs',
        stock: 0
      })
      .select('id')
      .single()
    if (errA || !pA) throw new Error(`Failed to create test product A: ${errA?.message}`)
    productAId = pA.id

    const { data: pB, error: errB } = await adminServiceClient
      .from('products')
      .insert({
        sku: skuB,
        name: 'Batch Test Product Beta',
        category: 'testing',
        price: 250_000,
        unit: 'pcs',
        stock: 0
      })
      .select('id')
      .single()
    if (errB || !pB) throw new Error(`Failed to create test product B: ${errB?.message}`)
    productBId = pB.id
  })

  afterAll(async () => {
    // Clean up test products and ledger records
    if (productAId) {
      await adminServiceClient.from('stock_movements').delete().eq('product_id', productAId)
      await adminServiceClient.from('products').delete().eq('id', productAId)
    }
    if (productBId) {
      await adminServiceClient.from('stock_movements').delete().eq('product_id', productBId)
      await adminServiceClient.from('products').delete().eq('id', productBId)
    }
  })

  it('1. Rejects batch mutation by anonymous caller', async () => {
    const { data, error } = await anonClient.rpc('record_batch_stock_movements', {
      p_type: 'IN',
      p_items: [{ product_id: productAId, quantity: 5 }],
      p_note: 'Anonymous batch attempt'
    })

    if (error) {
      expect(error.message).toBeTruthy()
    } else {
      const res = data as unknown as BatchRpcResponseEnvelope
      expect(res.success).toBe(false)
      expect(res.error).toBe('UNAUTHORIZED')
    }
  })

  it('2. Strictly rejects batch mutation by read-only auditor role (FORBIDDEN)', async () => {
    const { data, error } = await auditorClient.rpc('record_batch_stock_movements', {
      p_type: 'IN',
      p_items: [{ product_id: productAId, quantity: 5 }],
      p_note: 'Auditor batch attempt'
    })

    expect(error).toBeNull()
    const res = data as unknown as BatchRpcResponseEnvelope
    expect(res.success).toBe(false)
    expect(res.error).toBe('FORBIDDEN')
  })

  it('3. Executes atomic Batch Stock IN for Staff Gudang and updates all product stocks', async () => {
    const { data, error } = await staffClient.rpc('record_batch_stock_movements', {
      p_type: 'IN',
      p_items: [
        { product_id: productAId, quantity: 20 },
        { product_id: productBId, quantity: 30 }
      ],
      p_note: 'Receiving container shipment #PO-991'
    })

    expect(error).toBeNull()
    const res = data as unknown as BatchRpcResponseEnvelope
    expect(res.success).toBe(true)
    expect(res.data?.items_count).toBe(2)
    expect(res.data?.type).toBe('IN')
    expect(res.data?.batch_id).toBeDefined()

    // Verify actual database stocks
    const { data: dbA } = await adminServiceClient.from('products').select('stock').eq('id', productAId).single()
    const { data: dbB } = await adminServiceClient.from('products').select('stock').eq('id', productBId).single()
    expect(dbA?.stock).toBe(20)
    expect(dbB?.stock).toBe(30)
  })

  it('4. ENFORCES ATOMIC ALL-OR-NOTHING: If one item exceeds available stock in OUT, entire batch is rolled back', async () => {
    // Current stock: A=20, B=30
    // Request: A=5 (valid), B=50 (exceeds 30!)
    const { data, error } = await staffClient.rpc('record_batch_stock_movements', {
      p_type: 'OUT',
      p_items: [
        { product_id: productAId, quantity: 5 },
        { product_id: productBId, quantity: 50 }
      ],
      p_note: 'Overdraft issuance attempt'
    })

    expect(error).toBeNull()
    const res = data as unknown as BatchRpcResponseEnvelope
    expect(res.success).toBe(false)
    expect(res.error).toBe('INSUFFICIENT_STOCK')
    expect(res.message).toContain('Insufficient stock')

    // CRITICAL ATOMICITY INVARIANT:
    // Product A stock MUST NOT have changed to 15! Both must stay exactly 20 and 30!
    const { data: dbA } = await adminServiceClient.from('products').select('stock').eq('id', productAId).single()
    const { data: dbB } = await adminServiceClient.from('products').select('stock').eq('id', productBId).single()
    expect(dbA?.stock).toBe(20)
    expect(dbB?.stock).toBe(30)
  })

  it('5. Executes valid Batch Stock OUT for Administrator and creates audit ledger entries', async () => {
    // Current stock: A=20, B=30
    // Issue A=8, B=12 -> Expected new stocks: A=12, B=18
    const { data, error } = await adminClient.rpc('record_batch_stock_movements', {
      p_type: 'OUT',
      p_items: [
        { product_id: productAId, quantity: 8 },
        { product_id: productBId, quantity: 12 }
      ],
      p_note: 'Branch transfer to Store #1'
    })

    expect(error).toBeNull()
    const res = data as unknown as BatchRpcResponseEnvelope
    expect(res.success).toBe(true)
    expect(res.data?.items_count).toBe(2)

    const { data: dbA } = await adminServiceClient.from('products').select('stock').eq('id', productAId).single()
    const { data: dbB } = await adminServiceClient.from('products').select('stock').eq('id', productBId).single()
    expect(dbA?.stock).toBe(12)
    expect(dbB?.stock).toBe(18)

    // Verify ledger records exist
    const { data: movements } = await adminServiceClient
      .from('stock_movements')
      .select('*')
      .in('product_id', [productAId, productBId])
      .order('created_at', { ascending: false })

    expect(movements?.length).toBeGreaterThanOrEqual(4)
  })
})
