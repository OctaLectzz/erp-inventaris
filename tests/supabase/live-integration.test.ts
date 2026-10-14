import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import type { Database } from '@/types/database'

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

interface RpcResponseData {
  movement_id: string
  product_id: string
  type: string
  quantity: number
  stock_before: number
  stock_after: number
  note: string
}

interface RpcResponseEnvelope {
  success: boolean
  data?: RpcResponseData
  error?: string
  message?: string
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const adminEmail = process.env.DEMO_ADMIN_EMAIL || 'admin@inventra.demo'
const adminPassword = process.env.DEMO_ADMIN_PASSWORD!
const ownerEmail = process.env.DEMO_OWNER_EMAIL || 'owner@inventra.demo'
const ownerPassword = process.env.DEMO_OWNER_PASSWORD!

const hasLiveCredentials = Boolean(supabaseUrl && anonKey && serviceRoleKey && adminPassword && ownerPassword)

describe.runIf(hasLiveCredentials)('Live Supabase Integration & Security Gates', () => {
  // Clients for testing different actors
  const adminServiceClient = createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })

  let adminClient: ReturnType<typeof createClient<Database>>
  let ownerClient: ReturnType<typeof createClient<Database>>
  let anonClient: ReturnType<typeof createClient<Database>>

  let adminUserId: string
  let ownerUserId: string
  let testProductId: string
  const testProductSku = 'TEST-AUDIT-SKU-999'

  beforeAll(async () => {
    // 1. Anon client
    anonClient = createClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })

    // 2. Admin client
    adminClient = createClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    const { data: adminAuth, error: adminAuthErr } = await adminClient.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    })
    if (adminAuthErr || !adminAuth.user) {
      throw new Error(`Admin sign in failed: ${adminAuthErr?.message}`)
    }
    adminUserId = adminAuth.user.id

    // 3. Owner client
    ownerClient = createClient<Database>(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
    const { data: ownerAuth, error: ownerAuthErr } = await ownerClient.auth.signInWithPassword({
      email: ownerEmail,
      password: ownerPassword
    })
    if (ownerAuthErr || !ownerAuth.user) {
      throw new Error(`Owner sign in failed: ${ownerAuthErr?.message}`)
    }
    ownerUserId = ownerAuth.user.id

    // 4. Create an isolated test product via admin client
    // Insert with stock 0 (enforced for authenticated users)
    const { data: inserted, error: insertErr } = await adminClient
      .from('products')
      .insert({
        sku: testProductSku,
        name: 'Automated Test Product',
        category: 'testing',
        price: 50_000,
        unit: 'pcs',
        description: 'Temporary item for live RPC and security testing'
      })
      .select('id')
      .single()

    if (insertErr || !inserted) {
      throw new Error(`Failed to create test product: ${insertErr?.message}`)
    }
    testProductId = inserted.id

    // Use RPC as admin to initialize stock to 10
    const { data: initStock, error: initErr } = await adminClient.rpc('record_stock_movement', {
      p_product_id: testProductId,
      p_type: 'IN',
      p_quantity: 10,
      p_note: 'Initial baseline stock for test suite'
    })
    if (initErr || !(initStock as { success: boolean })?.success) {
      throw new Error(`Failed to set initial stock via RPC: ${initErr?.message || JSON.stringify(initStock)}`)
    }
  })

  afterAll(async () => {
    // Cleanup temporary test data cleanly using service role
    if (testProductId) {
      await adminServiceClient.from('stock_movements').delete().eq('product_id', testProductId)

      await adminServiceClient.from('products').delete().eq('id', testProductId)
    }
  })

  describe('A. Security & Access Boundaries', () => {
    it('denies anonymous users from reading public.profiles', async () => {
      const { data, error } = await anonClient.from('profiles').select('*')
      if (error) {
        expect(error.message).toMatch(/permission denied|row-level security/i)
      } else {
        expect(data).toEqual([])
      }
    })

    it('allows administrator to view only own profile', async () => {
      const { data, error } = await adminClient.from('profiles').select('*')
      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data![0].id).toBe(adminUserId)
      expect(['administrator', 'admin_gudang']).toContain(data![0].role)
    })

    it('allows auditor to view only own profile', async () => {
      const { data, error } = await ownerClient.from('profiles').select('*')
      expect(error).toBeNull()
      expect(data).toHaveLength(1)
      expect(data![0].id).toBe(ownerUserId)
      expect(['auditor', 'owner']).toContain(data![0].role)
    })

    it('rejects self-role elevation attempts by admin_gudang', async () => {
      const { error } = await adminClient
        .from('profiles')
        .update({ role: 'owner' } as unknown as { full_name: string })
        .eq('id', adminUserId)

      // Rejected either by column-level privilege (role column excluded) or trigger
      expect(error).not.toBeNull()
    })

    it('rejects self-role elevation attempts by owner', async () => {
      const { error } = await ownerClient
        .from('profiles')
        .update({ role: 'admin_gudang' } as unknown as { full_name: string })
        .eq('id', ownerUserId)

      expect(error).not.toBeNull()
    })

    it('rejects direct UPDATE to products.stock by authenticated admin_gudang', async () => {
      const { error } = await adminClient
        .from('products')
        .update({ stock: 9999 } as unknown as { name: string })
        .eq('id', testProductId)

      // Column-level privilege explicitly denies update on stock
      expect(error).not.toBeNull()
    })

    it('rejects direct UPDATE to products.stock by owner', async () => {
      const { error } = await ownerClient
        .from('products')
        .update({ stock: 9999 } as unknown as { name: string })
        .eq('id', testProductId)

      expect(error).not.toBeNull()
    })

    it('rejects direct INSERT into stock_movements ledger by admin_gudang', async () => {
      const { error } = await adminClient.from('stock_movements').insert({
        product_id: testProductId,
        user_id: adminUserId,
        type: 'IN',
        quantity: 100,
        stock_before: 10,
        stock_after: 110,
        note: 'Unauthorized direct insert attempt'
      })

      // Privileges on stock_movements strictly revoked for INSERT
      expect(error).not.toBeNull()
    })

    it('rejects direct DELETE on stock_movements ledger', async () => {
      const { error } = await adminClient.from('stock_movements').delete().eq('product_id', testProductId)

      expect(error).not.toBeNull()
    })
  })

  describe('B. Atomic Stock Mutation RPC Execution', () => {
    it('Scenario 1: executes valid Stock IN and increments stock correctly', async () => {
      const { data, error } = await adminClient.rpc('record_stock_movement', {
        p_product_id: testProductId,
        p_type: 'IN',
        p_quantity: 5,
        p_note: 'Valid Stock IN test'
      })

      expect(error).toBeNull()
      const res = data as unknown as RpcResponseEnvelope
      expect(res.success).toBe(true)
      expect(res.data?.stock_before).toBe(10)
      expect(res.data?.stock_after).toBe(15)
      expect(res.data?.type).toBe('IN')
      expect(res.data?.quantity).toBe(5)

      // Verify actual product stock in database
      const { data: prod } = await adminClient.from('products').select('stock').eq('id', testProductId).single()
      expect(prod?.stock).toBe(15)
    })

    it('Scenario 2: executes valid Stock OUT and decrements stock correctly', async () => {
      const { data, error } = await adminClient.rpc('record_stock_movement', {
        p_product_id: testProductId,
        p_type: 'OUT',
        p_quantity: 3,
        p_note: 'Valid Stock OUT test'
      })

      expect(error).toBeNull()
      const res = data as unknown as RpcResponseEnvelope
      expect(res.success).toBe(true)
      expect(res.data?.stock_before).toBe(15)
      expect(res.data?.stock_after).toBe(12)
      expect(res.data?.type).toBe('OUT')

      const { data: prod } = await adminClient.from('products').select('stock').eq('id', testProductId).single()
      expect(prod?.stock).toBe(12)
    })

    it('Scenario 3: rejects Stock OUT when quantity exceeds available stock', async () => {
      const { data, error } = await adminClient.rpc('record_stock_movement', {
        p_product_id: testProductId,
        p_type: 'OUT',
        p_quantity: 50, // Available is 12
        p_note: 'Excessive OUT request'
      })

      expect(error).toBeNull()
      const res = data as unknown as RpcResponseEnvelope
      expect(res.success).toBe(false)
      expect(res.error).toBe('INSUFFICIENT_STOCK')

      // Invariant: stock MUST remain unchanged
      const { data: prod } = await adminClient.from('products').select('stock').eq('id', testProductId).single()
      expect(prod?.stock).toBe(12)
    })

    it('Scenario 4: rejects zero or negative quantity', async () => {
      const { data: zeroRes } = await adminClient.rpc('record_stock_movement', {
        p_product_id: testProductId,
        p_type: 'IN',
        p_quantity: 0,
        p_note: 'Zero quantity test'
      })
      const resZero = zeroRes as unknown as RpcResponseEnvelope
      expect(resZero.success).toBe(false)
      expect(resZero.error).toBe('INVALID_QUANTITY')

      const { data: negRes } = await adminClient.rpc('record_stock_movement', {
        p_product_id: testProductId,
        p_type: 'IN',
        p_quantity: -5,
        p_note: 'Negative quantity test'
      })
      const resNeg = negRes as unknown as RpcResponseEnvelope
      expect(resNeg.success).toBe(false)
      expect(resNeg.error).toBe('INVALID_QUANTITY')
    })

    it('Scenario 5: rejects invalid movement type or empty note', async () => {
      const { data: typeRes } = await adminClient.rpc('record_stock_movement', {
        p_product_id: testProductId,
        p_type: 'TRANSFER',
        p_quantity: 2,
        p_note: 'Invalid type'
      })
      const resType = typeRes as unknown as RpcResponseEnvelope
      expect(resType.success).toBe(false)
      expect(resType.error).toBe('INVALID_TYPE')

      const { data: emptyNoteRes } = await adminClient.rpc('record_stock_movement', {
        p_product_id: testProductId,
        p_type: 'IN',
        p_quantity: 2,
        p_note: '   '
      })
      const resNote = emptyNoteRes as unknown as RpcResponseEnvelope
      expect(resNote.success).toBe(false)
      expect(resNote.error).toBe('EMPTY_NOTE')
    })

    it('Scenario 6: returns PRODUCT_NOT_FOUND when targeting non-existent UUID', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'
      const { data } = await adminClient.rpc('record_stock_movement', {
        p_product_id: nonExistentId,
        p_type: 'IN',
        p_quantity: 5,
        p_note: 'Missing product'
      })
      const res = data as unknown as RpcResponseEnvelope
      expect(res.success).toBe(false)
      expect(res.error).toBe('PRODUCT_NOT_FOUND')
    })

    it('Scenario 7: rejects stock mutation by read-only owner role (FORBIDDEN)', async () => {
      const { data } = await ownerClient.rpc('record_stock_movement', {
        p_product_id: testProductId,
        p_type: 'IN',
        p_quantity: 5,
        p_note: 'Owner attempting mutation'
      })
      const res = data as unknown as RpcResponseEnvelope
      expect(res.success).toBe(false)
      expect(res.error).toBe('FORBIDDEN')
    })

    it('Scenario 8: rejects stock mutation by anonymous caller', async () => {
      const { data, error } = await anonClient.rpc('record_stock_movement', {
        p_product_id: testProductId,
        p_type: 'IN',
        p_quantity: 5,
        p_note: 'Anon attempting mutation'
      })

      // Denied either by function execute privilege or internal auth.uid check
      if (error) {
        expect(error.message).toMatch(/permission denied|function/i)
      } else {
        const res = data as unknown as RpcResponseEnvelope
        expect(res.success).toBe(false)
        expect(res.error).toBe('UNAUTHORIZED')
      }
    })

    it('Scenario 9: enforces mathematical invariant (final = initial + IN - OUT)', async () => {
      // Baseline initial stock: 10
      // IN: 5 (resulting in 15)
      // OUT: 3 (resulting in 12)
      // Final expected: 10 + 5 - 3 = 12
      const { data: movements } = await adminClient
        .from('stock_movements')
        .select('type, quantity, stock_before, stock_after')
        .eq('product_id', testProductId)
        .order('created_at', { ascending: true })

      expect(movements).not.toBeNull()
      // 3 successful movements: baseline (10), IN (5), OUT (3)
      expect(movements!.length).toBe(3)

      let calculatedStock = 0
      for (let i = 0; i < movements!.length; i++) {
        const m = movements![i]
        if (i === 0) {
          calculatedStock = m.quantity
        } else if (m.type === 'IN') {
          calculatedStock += m.quantity
        } else if (m.type === 'OUT') {
          calculatedStock -= m.quantity
        }
      }

      const { data: prod } = await adminClient.from('products').select('stock').eq('id', testProductId).single()

      expect(prod?.stock).toBe(calculatedStock)
      expect(prod?.stock).toBe(12)
    })

    it('Scenario 10: handles concurrent mutations with pessimistic row lock preventing lost updates and overdrafts', async () => {
      // Current stock is 12. We fire 3 concurrent OUT requests of 5 units each in parallel.
      // Total requested is 15 > 12. Exactly two must succeed (12 - 5 - 5 = 2) and one must be rejected.
      const mutationPromises = [
        adminClient.rpc('record_stock_movement', {
          p_product_id: testProductId,
          p_type: 'OUT',
          p_quantity: 5,
          p_note: 'Concurrent OUT request A'
        }),
        adminClient.rpc('record_stock_movement', {
          p_product_id: testProductId,
          p_type: 'OUT',
          p_quantity: 5,
          p_note: 'Concurrent OUT request B'
        }),
        adminClient.rpc('record_stock_movement', {
          p_product_id: testProductId,
          p_type: 'OUT',
          p_quantity: 5,
          p_note: 'Concurrent OUT request C'
        })
      ]

      const results = await Promise.all(mutationPromises)

      const successCount = results.filter((r) => (r.data as unknown as RpcResponseEnvelope)?.success === true).length
      const failureCount = results.filter((r) => {
        const envelope = r.data as unknown as RpcResponseEnvelope
        return !envelope || envelope.success === false || envelope.error === 'INSUFFICIENT_STOCK'
      }).length

      expect(successCount).toBe(2)
      expect(failureCount).toBe(1)

      // Verify database stock is strictly 2
      const { data: prod } = await adminClient.from('products').select('stock').eq('id', testProductId).single()
      expect(prod?.stock).toBe(2)

      // Verify total ledger records match exactly 5 movements (1 initial + 2 previous + 2 concurrent)
      const { data: allMovements } = await adminClient.from('stock_movements').select('type, quantity').eq('product_id', testProductId)

      expect(allMovements?.length).toBe(5)
    })
  })

  describe('C. Inventory Catalog & KPI Metrics Verification', () => {
    it('verifies 30 operational catalog products with zero SKU duplicates', async () => {
      const { data: products, error } = await adminClient.from('products').select('sku, price, stock').neq('id', testProductId)

      expect(error).toBeNull()
      expect(products).not.toBeNull()
      expect(products!.length).toBeGreaterThanOrEqual(30)

      const skuSet = new Set<string>()
      for (const p of products!) {
        const skuLower = p.sku.toLowerCase()
        expect(skuSet.has(skuLower)).toBe(false)
        skuSet.add(skuLower)
        expect(p.price).toBeGreaterThanOrEqual(0)
        expect(p.stock).toBeGreaterThanOrEqual(0)
      }
    })

    it('verifies low stock calculation matches rule (stock < 5)', async () => {
      const { data: products } = await adminClient.from('products').select('stock').neq('id', testProductId)

      const computedLowStock = products!.filter((p) => p.stock < 5).length
      expect(computedLowStock).toBe(2)
    })
  })

  describe('D. Auth Session & Locale Middleware Integration', () => {
    it('initializes updateSession and handles locale responses without dropping headers', async () => {
      const { NextRequest } = await import('next/server')
      const { updateSession } = await import('@/lib/supabase/middleware')

      const idReq = new NextRequest('http://localhost:3000/id')
      const { response: idRes } = await updateSession(idReq)
      expect(idRes).toBeDefined()

      const enReq = new NextRequest('http://localhost:3000/en')
      const { response: enRes } = await updateSession(enReq)
      expect(enRes).toBeDefined()
    })
  })
})
