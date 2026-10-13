import { describe, expect, it } from 'vitest'

type UserRole = 'admin_gudang' | 'owner'

interface ProductRecord {
  id: string
  sku: string
  name: string
  category: string
  price: number
  stock: number
}

interface MovementRecord {
  id: string
  productId: string
  userId: string
  type: 'IN' | 'OUT'
  quantity: number
  stockBefore: number
  stockAfter: number
  note: string
  createdAt: string
}

// In-memory simulation of PostgreSQL database engine, RLS, and record_stock_movement RPC
class MockDatabaseEngine {
  public products = new Map<string, ProductRecord>()
  public movements: MovementRecord[] = []
  public profiles = new Map<string, { id: string; email: string; role: UserRole }>()

  // Simulate public.get_user_role(p_user_id)
  getUserRole(callingUserId: string | null, targetUserId: string | null, callingRole: string = 'authenticated'): UserRole | null {
    if (!targetUserId) return null
    // Unauthenticated callers without service_role cannot look up roles
    if (!callingUserId && callingRole !== 'service_role') return null
    // Authenticated callers cannot look up roles of other users (cross-user probing blocked)
    if (callingUserId && callingUserId !== targetUserId && callingRole !== 'service_role') return null
    const profile = this.profiles.get(targetUserId)
    return profile ? profile.role : null
  }

  // Simulate trg_protect_profile_role trigger
  updateProfile(userId: string, newRole: UserRole, callingRole: string = 'authenticated'): void {
    const existing = this.profiles.get(userId)
    if (!existing) throw new Error('Profile not found')
    if (callingRole !== 'service_role' && newRole !== existing.role) {
      throw new Error('Modifying user roles directly is forbidden.')
    }
    existing.role = newRole
  }

  // Simulate direct SQL UPDATE on public.products (column privileges + trg_protect_product_stock)
  updateProductDirectly(callingUserId: string, productId: string, updates: Partial<ProductRecord>): ProductRecord {
    const role = this.getUserRole(callingUserId, callingUserId)
    if (role !== 'admin_gudang') {
      throw new Error('FORBIDDEN: Only warehouse administrators can update products')
    }

    // Column privilege & trigger defense: direct updates to 'stock' are strictly forbidden
    if ('stock' in updates && updates.stock !== undefined) {
      throw new Error('Direct stock modification is forbidden. Inventory mutations must be recorded via public.record_stock_movement RPC.')
    }

    const product = this.products.get(productId)
    if (!product) throw new Error('Product not found')

    Object.assign(product, updates)
    return product
  }

  // Simulate direct SQL INSERT on public.products (column privileges + trg_protect_product_stock)
  insertProductDirectly(callingUserId: string, productData: Omit<ProductRecord, 'id' | 'stock'> & { id?: string; stock?: number }): ProductRecord {
    const role = this.getUserRole(callingUserId, callingUserId)
    if (role !== 'admin_gudang') {
      throw new Error('FORBIDDEN: Only warehouse administrators can insert products')
    }

    // Column privilege & trigger defense: stock cannot be set directly on INSERT (must be 0)
    if (productData.stock !== undefined && productData.stock !== 0) {
      throw new Error('Initial product stock must be zero. Record stock additions via public.record_stock_movement RPC.')
    }

    const id = productData.id || `prod-${Date.now()}`
    const record: ProductRecord = {
      ...productData,
      id,
      stock: 0
    }
    this.products.set(id, record)
    return record
  }

  // Simulate direct SQL INSERT/UPDATE/DELETE on public.stock_movements (privileges revoked)
  insertStockMovementDirectly(): void {
    throw new Error('PERMISSION_DENIED: Direct write access to stock_movements is revoked.')
  }
  updateStockMovementDirectly(): void {
    throw new Error('PERMISSION_DENIED: Direct update access to stock_movements is revoked.')
  }
  deleteStockMovementDirectly(): void {
    throw new Error('PERMISSION_DENIED: Direct delete access to stock_movements is revoked.')
  }

  // Simulate atomic public.record_stock_movement RPC function
  recordStockMovement(
    callingUserId: string | null,
    productId: string,
    type: string,
    quantity: number,
    note: string,
    simulateLedgerInsertFailure = false
  ): { success: boolean; data?: unknown; error?: string; message?: string } {
    // 1. Actor Identification
    if (!callingUserId) {
      return { success: false, error: 'UNAUTHORIZED', message: 'Authentication required to perform stock movements' }
    }

    // 2. Role-Based Access Enforcement
    const role = this.getUserRole(callingUserId, callingUserId)
    if (role !== 'admin_gudang') {
      return {
        success: false,
        error: 'FORBIDDEN',
        message: 'Only warehouse administrators (admin_gudang) can mutate inventory'
      }
    }

    // 3. Input Validation
    if (!Number.isInteger(quantity) || quantity <= 0) {
      return { success: false, error: 'INVALID_QUANTITY', message: 'Quantity must be a positive integer greater than zero' }
    }
    if (quantity > 2147483647) {
      return { success: false, error: 'QUANTITY_OVERFLOW', message: 'Quantity exceeds maximum allowed integer limit' }
    }
    if (type !== 'IN' && type !== 'OUT') {
      return { success: false, error: 'INVALID_TYPE', message: 'Movement type must be strictly IN or OUT' }
    }
    const cleanNote = (note || '').trim()
    if (!cleanNote) {
      return { success: false, error: 'EMPTY_NOTE', message: 'A non-empty reason or reference note is required for all movements' }
    }

    // 4. Pessimistic Row Lock (SELECT ... FOR UPDATE) & Product Existence Check
    const product = this.products.get(productId)
    if (!product) {
      return { success: false, error: 'PRODUCT_NOT_FOUND', message: 'Target product does not exist' }
    }

    const currentStock = product.stock
    let newStock = currentStock

    // 5. Stock Level Calculation & Availability Check
    if (type === 'IN') {
      if (currentStock + quantity > 2147483647) {
        return { success: false, error: 'STOCK_OVERFLOW', message: 'Resulting stock exceeds maximum inventory limit' }
      }
      newStock = currentStock + quantity
    } else if (type === 'OUT') {
      if (currentStock < quantity) {
        return {
          success: false,
          error: 'INSUFFICIENT_STOCK',
          message: `Insufficient stock. Available: ${currentStock}, Requested: ${quantity}`
        }
      }
      newStock = currentStock - quantity
    }

    // 6. Atomic Transaction Simulation
    // If movement insert fails, stock update must be rolled back
    const previousStockState = product.stock
    try {
      product.stock = newStock

      if (simulateLedgerInsertFailure) {
        throw new Error('SIMULATED_DB_CONSTRAINT_ERROR: Ledger append failed')
      }

      const movementId = `mov-${Date.now()}-${Math.random()}`
      const movement: MovementRecord = {
        id: movementId,
        productId,
        userId: callingUserId,
        type,
        quantity,
        stockBefore: currentStock,
        stockAfter: newStock,
        note: cleanNote,
        createdAt: new Date().toISOString()
      }
      this.movements.push(movement)

      return {
        success: true,
        data: {
          movement_id: movementId,
          product_id: productId,
          type,
          quantity,
          stock_before: currentStock,
          stock_after: newStock,
          note: cleanNote
        }
      }
    } catch (err) {
      // Transaction rollback: revert product stock
      product.stock = previousStockState
      throw err
    }
  }
}

describe('Stock Mutation RPC & Security Logic State Simulation', () => {
  const adminId = 'usr-admin-01'
  const ownerId = 'usr-owner-01'
  const prodId = 'prod-rice-01'

  function createTestDb(): MockDatabaseEngine {
    const db = new MockDatabaseEngine()
    db.profiles.set(adminId, { id: adminId, email: 'admin@inventra.local', role: 'admin_gudang' })
    db.profiles.set(ownerId, { id: ownerId, email: 'owner@inventra.local', role: 'owner' })
    db.products.set(prodId, {
      id: prodId,
      sku: 'GROC-RICE-001',
      name: 'Beras Premium 5kg',
      category: 'groceries',
      price: 85000,
      stock: 20
    })
    return db
  }

  it('rejects unauthenticated caller with UNAUTHORIZED', () => {
    const db = createTestDb()
    const result = db.recordStockMovement(null, prodId, 'IN', 5, 'Restock')
    expect(result.success).toBe(false)
    expect(result.error).toBe('UNAUTHORIZED')
  })

  it('rejects owner role with FORBIDDEN (owner is read-only oversight)', () => {
    const db = createTestDb()
    const result = db.recordStockMovement(ownerId, prodId, 'IN', 5, 'Restock attempt by owner')
    expect(result.success).toBe(false)
    expect(result.error).toBe('FORBIDDEN')
    expect(db.products.get(prodId)?.stock).toBe(20)
  })

  it('allows authorized admin_gudang to perform valid stock IN', () => {
    const db = createTestDb()
    const result = db.recordStockMovement(adminId, prodId, 'IN', 10, 'Supplier batch 101')
    expect(result.success).toBe(true)
    expect(db.products.get(prodId)?.stock).toBe(30)
    expect(db.movements.length).toBe(1)
    expect(db.movements[0].stockBefore).toBe(20)
    expect(db.movements[0].stockAfter).toBe(30)
  })

  it('allows authorized admin_gudang to perform valid stock OUT', () => {
    const db = createTestDb()
    const result = db.recordStockMovement(adminId, prodId, 'OUT', 5, 'Distribution dispatch')
    expect(result.success).toBe(true)
    expect(db.products.get(prodId)?.stock).toBe(15)
    expect(db.movements.length).toBe(1)
    expect(db.movements[0].stockBefore).toBe(20)
    expect(db.movements[0].stockAfter).toBe(15)
  })

  it('rejects stock OUT when requested quantity exceeds available stock', () => {
    const db = createTestDb()
    const result = db.recordStockMovement(adminId, prodId, 'OUT', 25, 'Excessive dispatch')
    expect(result.success).toBe(false)
    expect(result.error).toBe('INSUFFICIENT_STOCK')
    expect(db.products.get(prodId)?.stock).toBe(20) // Unchanged
    expect(db.movements.length).toBe(0)
  })

  it('rejects non-positive quantities (0, negative, float)', () => {
    const db = createTestDb()
    expect(db.recordStockMovement(adminId, prodId, 'IN', 0, 'Zero').error).toBe('INVALID_QUANTITY')
    expect(db.recordStockMovement(adminId, prodId, 'IN', -10, 'Negative').error).toBe('INVALID_QUANTITY')
    expect(db.recordStockMovement(adminId, prodId, 'IN', 2.5, 'Float').error).toBe('INVALID_QUANTITY')
    expect(db.products.get(prodId)?.stock).toBe(20)
  })

  it('rejects 32-bit integer quantity overflow', () => {
    const db = createTestDb()
    const result = db.recordStockMovement(adminId, prodId, 'IN', 2147483648, 'Overflow quantity')
    expect(result.success).toBe(false)
    expect(result.error).toBe('QUANTITY_OVERFLOW')
  })

  it('rejects invalid movement types', () => {
    const db = createTestDb()
    expect(db.recordStockMovement(adminId, prodId, 'TRANSFER', 5, 'Transfer').error).toBe('INVALID_TYPE')
    expect(db.recordStockMovement(adminId, prodId, 'in', 5, 'Lowercase').error).toBe('INVALID_TYPE')
  })

  it('rejects missing or whitespace-only notes', () => {
    const db = createTestDb()
    expect(db.recordStockMovement(adminId, prodId, 'IN', 5, '').error).toBe('EMPTY_NOTE')
    expect(db.recordStockMovement(adminId, prodId, 'IN', 5, '   ').error).toBe('EMPTY_NOTE')
  })

  it('rejects missing product ID with PRODUCT_NOT_FOUND', () => {
    const db = createTestDb()
    const result = db.recordStockMovement(adminId, 'non-existent-product', 'IN', 5, 'Restock')
    expect(result.success).toBe(false)
    expect(result.error).toBe('PRODUCT_NOT_FOUND')
  })

  it('rolls back product stock update if movement ledger insertion fails', () => {
    const db = createTestDb()
    expect(() => {
      db.recordStockMovement(adminId, prodId, 'IN', 10, 'Faulty write', true)
    }).toThrow('SIMULATED_DB_CONSTRAINT_ERROR')

    // Stock must have rolled back to initial 20
    expect(db.products.get(prodId)?.stock).toBe(20)
    expect(db.movements.length).toBe(0)
  })

  it('simulates serialized pessimistic row locking under concurrent OUT requests', () => {
    const db = createTestDb()
    // Product has stock = 20
    // Request 1: OUT 15
    const res1 = db.recordStockMovement(adminId, prodId, 'OUT', 15, 'Order 1')
    expect(res1.success).toBe(true)
    expect(db.products.get(prodId)?.stock).toBe(5)

    // Request 2 (arrived concurrently, serialized after lock released): OUT 10
    // Because available stock is now 5, second request is rejected with INSUFFICIENT_STOCK
    const res2 = db.recordStockMovement(adminId, prodId, 'OUT', 10, 'Order 2')
    expect(res2.success).toBe(false)
    expect(res2.error).toBe('INSUFFICIENT_STOCK')
    expect(db.products.get(prodId)?.stock).toBe(5)
  })

  it('prevents profile role modification via defensive trigger check', () => {
    const db = createTestDb()
    expect(() => {
      db.updateProfile(ownerId, 'admin_gudang')
    }).toThrow('Modifying user roles directly is forbidden.')
  })

  it('blocks direct SQL UPDATE on products stock column via column privileges and trigger defense', () => {
    const db = createTestDb()
    // admin_gudang attempts to bypass RPC by directly setting stock
    expect(() => {
      db.updateProductDirectly(adminId, prodId, { stock: 9999 })
    }).toThrow('Direct stock modification is forbidden. Inventory mutations must be recorded via public.record_stock_movement RPC.')

    // owner attempts direct update
    expect(() => {
      db.updateProductDirectly(ownerId, prodId, { stock: 9999 })
    }).toThrow('FORBIDDEN')

    // Stock remains unchanged
    expect(db.products.get(prodId)?.stock).toBe(20)
  })

  it('allows admin_gudang to update permitted non-stock catalog attributes directly', () => {
    const db = createTestDb()
    const updated = db.updateProductDirectly(adminId, prodId, {
      name: 'Beras Premium Pulen 5kg',
      price: 90000
    })
    expect(updated.name).toBe('Beras Premium Pulen 5kg')
    expect(updated.price).toBe(90000)
    expect(updated.stock).toBe(20) // Intact

    // owner cannot update catalog attributes
    expect(() => {
      db.updateProductDirectly(ownerId, prodId, { price: 95000 })
    }).toThrow('FORBIDDEN')
  })

  it('enforces non-recursive role resolution and prevents cross-user role probing', () => {
    const db = createTestDb()
    // User can inspect own role
    expect(db.getUserRole(adminId, adminId)).toBe('admin_gudang')
    expect(db.getUserRole(ownerId, ownerId)).toBe('owner')

    // Cross-user inspection is blocked
    expect(db.getUserRole(adminId, ownerId)).toBeNull()
    expect(db.getUserRole(ownerId, adminId)).toBeNull()

    // Unauthenticated inspection is blocked
    expect(db.getUserRole(null, adminId)).toBeNull()

    // Administrative service_role inspection is allowed
    expect(db.getUserRole(null, adminId, 'service_role')).toBe('admin_gudang')
  })

  it('allows service_role to update user roles for administrative provisioning and demo resets', () => {
    const db = createTestDb()
    // Authenticated caller cannot change role
    expect(() => {
      db.updateProfile(ownerId, 'admin_gudang', 'authenticated')
    }).toThrow('Modifying user roles directly is forbidden.')

    // service_role can change role for administrative provisioning
    db.updateProfile(ownerId, 'admin_gudang', 'service_role')
    expect(db.profiles.get(ownerId)?.role).toBe('admin_gudang')
  })

  it('enforces initial stock = 0 on product insertion and rejects non-zero stock', () => {
    const db = createTestDb()
    // admin_gudang attempts to insert with initial stock = 50
    expect(() => {
      db.insertProductDirectly(adminId, {
        sku: 'TEST-PROD-001',
        name: 'Test Product',
        category: 'groceries',
        price: 50000,
        stock: 50
      })
    }).toThrow('Initial product stock must be zero. Record stock additions via public.record_stock_movement RPC.')

    // admin_gudang inserts with stock = 0 or omitted
    const created = db.insertProductDirectly(adminId, {
      sku: 'TEST-PROD-001',
      name: 'Test Product',
      category: 'groceries',
      price: 50000
    })
    expect(created.stock).toBe(0)
    expect(db.products.get(created.id)?.stock).toBe(0)

    // owner cannot insert products
    expect(() => {
      db.insertProductDirectly(ownerId, {
        sku: 'TEST-PROD-002',
        name: 'Owner Product',
        category: 'groceries',
        price: 25000
      })
    }).toThrow('FORBIDDEN')
  })

  it('rejects direct INSERT, UPDATE, and DELETE on stock_movements table for application roles', () => {
    const db = createTestDb()
    expect(() => db.insertStockMovementDirectly()).toThrow('PERMISSION_DENIED')
    expect(() => db.updateStockMovementDirectly()).toThrow('PERMISSION_DENIED')
    expect(() => db.deleteStockMovementDirectly()).toThrow('PERMISSION_DENIED')
  })

  it('executes stock mutations purely via RPC without requiring forgeable GUC tokens', () => {
    const db = createTestDb()
    // Normal RPC call without any session configuration setting
    const result = db.recordStockMovement(adminId, prodId, 'IN', 15, 'Restock without token')
    expect(result.success).toBe(true)
    expect(db.products.get(prodId)?.stock).toBe(35)
    expect(db.movements.length).toBe(1)
  })

  it('verifies IDR price conversion and safe integer range boundaries', () => {
    const usdPrices = [9.99, 12.5, 49.99, 150.0, 2450.0]
    const conversionRate = 16000

    for (const usd of usdPrices) {
      const idr = Math.round(usd * conversionRate)
      expect(Number.isInteger(idr)).toBe(true)
      expect(idr).toBeGreaterThan(0)
      expect(idr).toBeLessThan(Number.MAX_SAFE_INTEGER)
    }

    // Max safe JavaScript integer is 9,007,199,254,740,991 (9 quadrillion IDR)
    expect(Number.MAX_SAFE_INTEGER).toBe(9007199254740991)
  })
})
