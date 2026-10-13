import type { DummyJsonProduct, Product, StockMovement } from '@/types/inventory'

/**
 * Creates a deterministic domain Product fixture for testing.
 */
export function createMockProduct(overrides?: Partial<Product>): Product {
  return {
    id: '11111111-1111-1111-1111-111111111101',
    sku: 'BEAU-001',
    name: 'Essence Mascara Lash Princess',
    category: 'beauty',
    unit: 'pcs',
    price: 160_000, // 9.99 USD * 16,000 IDR rounded
    stock: 10,
    description: 'The Essence Mascara Lash Princess is a popular mascara.',
    imageUrl: 'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/thumbnail.png',
    createdAt: '2026-10-13T00:00:00Z',
    updatedAt: '2026-10-13T00:00:00Z',
    ...overrides
  }
}

/**
 * Creates a deterministic domain StockMovement fixture for testing.
 */
export function createMockStockMovement(overrides?: Partial<StockMovement>): StockMovement {
  return {
    id: '22222222-2222-2222-2222-222222222201',
    productId: '11111111-1111-1111-1111-111111111101',
    userId: '33333333-3333-3333-3333-333333333301',
    type: 'IN',
    quantity: 5,
    stockBefore: 10,
    stockAfter: 15,
    note: 'Restock mingguan dari supplier utama',
    createdAt: '2026-10-13T01:00:00Z',
    ...overrides
  }
}

/**
 * Creates a deterministic DummyJsonProduct fixture for testing.
 */
export function createMockDummyJsonProduct(overrides?: Partial<DummyJsonProduct>): DummyJsonProduct {
  return {
    id: 1,
    title: 'Essence Mascara Lash Princess',
    description: 'The Essence Mascara Lash Princess is a popular mascara.',
    category: 'beauty',
    price: 9.99,
    discountPercentage: 7.17,
    rating: 4.94,
    stock: 10,
    tags: ['beauty', 'mascara'],
    brand: 'Essence',
    sku: 'RCH45Q1A',
    weight: 2,
    dimensions: {
      width: 23.17,
      height: 14.43,
      depth: 28.01
    },
    warrantyInformation: '1 month warranty',
    shippingInformation: 'Ships in 1 month',
    availabilityStatus: 'Low Stock',
    reviews: [],
    returnPolicy: '30 days return policy',
    minimumOrderQuantity: 24,
    meta: {
      createdAt: '2024-05-23T08:56:21.618Z',
      updatedAt: '2024-05-23T08:56:21.618Z',
      barcode: '9164035105721',
      qrCode: 'https://assets.dummyjson.com/public/qr-code.png'
    },
    images: ['https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/1.png'],
    thumbnail: 'https://cdn.dummyjson.com/products/images/beauty/Essence%20Mascara%20Lash%20Princess/thumbnail.png',
    ...overrides
  }
}
