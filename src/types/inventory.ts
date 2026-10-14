import type { ProductRow, StockMovementRow } from './database'

export type MovementType = 'IN' | 'OUT'

export const MOVEMENT_TYPES = {
  IN: 'IN' as MovementType,
  OUT: 'OUT' as MovementType
} as const

export const VALID_MOVEMENT_TYPES: readonly MovementType[] = ['IN', 'OUT'] as const

export function isValidMovementType(type: unknown): type is MovementType {
  return typeof type === 'string' && VALID_MOVEMENT_TYPES.includes(type as MovementType)
}

/**
 * Clean domain representation of a product category.
 */
export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  productCount: number
  createdAt: string
  updatedAt: string
}

/**
 * Clean domain representation of a product catalog item.
 */
export interface Product {
  id: string
  sku: string
  name: string
  category: string
  categoryId?: string | null
  unit: string
  price: number // IDR (bigint in DB mapped to number in JS/TS)
  stock: number
  description: string | null
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

/**
 * Clean domain representation of a stock movement ledger item.
 */
export interface StockMovement {
  id: string
  productId: string
  userId: string
  type: MovementType
  quantity: number
  stockBefore: number
  stockAfter: number
  note: string
  createdAt: string
}

/**
 * Parameters for recording an inventory mutation via RPC.
 */
export interface StockMutationParams {
  productId: string
  type: MovementType
  quantity: number
  note: string
}

/**
 * Standard structured result envelope returned by stock mutation RPC.
 */
export interface StockMutationSuccessData {
  movement_id: string
  product_id: string
  type: MovementType
  quantity: number
  stock_before: number
  stock_after: number
  note: string
}

export type StockMutationResult =
  | {
      success: true
      data: StockMutationSuccessData
      error?: never
      message?: never
    }
  | {
      success: false
      error: string
      message: string
      data?: never
    }

/**
 * High-level inventory KPI summary metrics.
 */
export interface InventorySummary {
  totalSkus: number
  totalUnits: number
  totalInventoryValue: number
  lowStockCount: number // Items with stock < 5
}

/**
 * DummyJSON Product schema returned from https://dummyjson.com/products.
 */
export interface DummyJsonProduct {
  id: number
  title: string
  description: string
  category: string
  price: number // USD
  discountPercentage?: number
  rating?: number
  stock: number
  tags?: string[]
  brand?: string
  sku?: string
  weight?: number
  dimensions?: {
    width: number
    height: number
    depth: number
  }
  warrantyInformation?: string
  shippingInformation?: string
  availabilityStatus?: string
  reviews?: Array<{
    rating: number
    comment: string
    date: string
    reviewerName: string
    reviewerEmail: string
  }>
  returnPolicy?: string
  minimumOrderQuantity?: number
  meta?: {
    createdAt: string
    updatedAt: string
    barcode: string
    qrCode: string
  }
  images: string[]
  thumbnail: string
}

export interface DummyJsonResponse {
  products: DummyJsonProduct[]
  total: number
  skip: number
  limit: number
}

/**
 * Result returned by the catalog synchronization service.
 */
export interface CatalogSyncResult {
  totalFetched: number
  insertedCount: number
  updatedCount: number
  skippedCount: number
  errors: string[]
}

/**
 * Transform ProductRow to domain Product.
 */
export function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    categoryId: row.category_id,
    unit: row.unit,
    price: Number(row.price),
    stock: row.stock,
    description: row.description,
    imageUrl: row.image_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

/**
 * Transform StockMovementRow to domain StockMovement.
 */
export function toStockMovement(row: StockMovementRow): StockMovement {
  return {
    id: row.id,
    productId: row.product_id,
    userId: row.user_id,
    type: row.type as MovementType,
    quantity: row.quantity,
    stockBefore: row.stock_before,
    stockAfter: row.stock_after,
    note: row.note,
    createdAt: row.created_at
  }
}

/**
 * Filter parameters for searching and filtering the product catalog.
 */
export interface ProductCatalogFilter {
  search?: string
  category?: string
  stockStatus?: 'all' | 'low_stock' | 'normal'
}

/**
 * Detailed stock movement with linked product information and user attribution.
 */
export interface StockMovementWithDetails {
  id: string
  productId: string
  userId: string
  type: MovementType
  quantity: number
  stockBefore: number
  stockAfter: number
  note: string
  createdAt: string
  product: {
    id: string
    sku: string
    name: string
    category: string
    unit: string
  }
  user?: {
    id: string
    fullName: string
    email?: string
    role?: string
  }
}

/**
 * Filter parameters for searching and filtering stock movement history.
 */
export interface StockMovementFilters {
  search?: string
  type?: 'ALL' | 'IN' | 'OUT'
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

/**
 * Paginated result of stock movements query.
 */
export interface StockMovementListResult {
  movements: StockMovementWithDetails[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
