import type { MovementType, StockMovement } from '@/types/inventory'

/**
 * Strict warehouse safety stock threshold.
 * Per business rules, low stock is strictly defined as stock < 5 (items with 0, 1, 2, 3, 4 units).
 * Items with 5 units are considered normal stock.
 */
export const LOW_STOCK_THRESHOLD = 5

/**
 * Checks whether an item's stock is below the warehouse safety stock threshold.
 */
export function isLowStock(stock: number): boolean {
  return Number.isFinite(stock) && stock < LOW_STOCK_THRESHOLD
}

export type StockMutationCalculationResult =
  | {
      success: true
      stockBefore: number
      stockAfter: number
      change: number
    }
  | {
      success: false
      error: 'INVALID_QUANTITY' | 'INVALID_CURRENT_STOCK' | 'INSUFFICIENT_STOCK'
      message: string
    }

/**
 * Pure domain logic: Computes inventory mutation outcomes and guarantees invariants.
 *
 * INVARIANTS:
 * 1. Quantity must be a strictly positive integer (> 0).
 * 2. Current stock must be a non-negative integer (>= 0).
 * 3. Stock OUT cannot exceed current available stock (no overdraft).
 * 4. stockAfter = stockBefore + (type === 'IN' ? quantity : -quantity).
 */
export function calculateStockMutation(currentStock: number, type: MovementType, quantity: number): StockMutationCalculationResult {
  // Guard 1: Quantity must be a finite, positive integer
  if (!Number.isFinite(quantity) || !Number.isInteger(quantity) || quantity <= 0) {
    return {
      success: false,
      error: 'INVALID_QUANTITY',
      message: 'Kuantitas harus berupa bilangan bulat positif lebih besar dari 0'
    }
  }

  // Guard 2: Current stock must be a finite, non-negative integer
  if (!Number.isFinite(currentStock) || !Number.isInteger(currentStock) || currentStock < 0) {
    return {
      success: false,
      error: 'INVALID_CURRENT_STOCK',
      message: 'Stok saat ini harus berupa bilangan bulat non-negatif'
    }
  }

  // Guard 3: Overdraft protection for OUT mutations
  if (type === 'OUT' && quantity > currentStock) {
    return {
      success: false,
      error: 'INSUFFICIENT_STOCK',
      message: `Stok tidak mencukupi untuk mutasi keluar. Tersedia: ${currentStock}, Diminta: ${quantity}`
    }
  }

  const change = type === 'IN' ? quantity : -quantity
  const stockAfter = currentStock + change

  // Guard 4: Invariant consistency verification
  if (stockAfter < 0 || stockAfter !== currentStock + change) {
    return {
      success: false,
      error: 'INSUFFICIENT_STOCK',
      message: 'Perhitungan menghasilkan inkonsistensi stok negatif'
    }
  }

  return {
    success: true,
    stockBefore: currentStock,
    stockAfter,
    change
  }
}

export interface InventoryItemMetrics {
  stock: number
  price: number
}

export interface InventorySummaryResult {
  totalSkus: number
  totalUnits: number
  totalInventoryValue: number
  lowStockCount: number
}

/**
 * Pure domain logic: Calculates high-level inventory KPI summary metrics.
 *
 * RULES:
 * - totalSkus: Count of distinct products.
 * - totalUnits: Sum of stock quantities across products.
 * - totalInventoryValue: Sum of (stock * price).
 * - lowStockCount: Count of items where stock < 5 (strictly less than 5).
 */
export function calculateInventorySummary(products: InventoryItemMetrics[]): InventorySummaryResult {
  if (!Array.isArray(products) || products.length === 0) {
    return {
      totalSkus: 0,
      totalUnits: 0,
      totalInventoryValue: 0,
      lowStockCount: 0
    }
  }

  let totalSkus = 0
  let totalUnits = 0
  let totalInventoryValue = 0
  let lowStockCount = 0

  for (const item of products) {
    // Skip or safely sanitize invalid items
    if (!item || typeof item !== 'object') continue

    const stock = Number.isFinite(item.stock) && item.stock >= 0 ? Math.floor(item.stock) : 0
    const price = Number.isFinite(item.price) && item.price >= 0 ? Math.floor(item.price) : 0

    totalSkus++
    totalUnits += stock

    const itemValue = stock * price
    // Prevent JavaScript 64-bit float precision loss beyond MAX_SAFE_INTEGER
    if (Number.isSafeInteger(totalInventoryValue + itemValue)) {
      totalInventoryValue += itemValue
    } else {
      totalInventoryValue = Number.MAX_SAFE_INTEGER
    }

    if (stock < LOW_STOCK_THRESHOLD) {
      lowStockCount++
    }
  }

  return {
    totalSkus,
    totalUnits,
    totalInventoryValue,
    lowStockCount
  }
}

/**
 * Verifies that a recorded stock movement ledger record obeys domain integrity rules.
 */
export function validateStockMovement(movement: StockMovement): boolean {
  if (!movement) return false

  if (movement.type !== 'IN' && movement.type !== 'OUT') return false
  if (!Number.isInteger(movement.quantity) || movement.quantity <= 0) return false
  if (!Number.isInteger(movement.stockBefore) || movement.stockBefore < 0) return false
  if (!Number.isInteger(movement.stockAfter) || movement.stockAfter < 0) return false

  const expectedDelta = movement.type === 'IN' ? movement.quantity : -movement.quantity
  if (movement.stockAfter !== movement.stockBefore + expectedDelta) return false

  if (typeof movement.note !== 'string' || movement.note.trim().length < 3) return false
  if (!movement.productId || !movement.userId) return false

  return true
}
