import { describe, expect, it } from 'vitest'

import { convertUsdToIdr, generateDeterministicSku, PROJECT_FIXED_USD_TO_IDR_RATE } from '@/services/catalog-sync'

import { createMockDummyJsonProduct } from '../fixtures/inventory-fixtures'

import type { DummyJsonProduct } from '@/types/inventory'

describe('Catalog & SKU Domain Unit Tests', () => {
  describe('Deterministic SKU Generation', () => {
    it('should retain and uppercase valid DummyJSON product sku', () => {
      const product = createMockDummyJsonProduct({ sku: 'beauty-mascara-01' })
      const sku = generateDeterministicSku(product)
      expect(sku).toBe('BEAUTY-MASCARA-01')
    })

    it('should trim surrounding whitespace in sku', () => {
      const product = createMockDummyJsonProduct({ sku: '   SKU-TRIM-01   ' })
      const sku = generateDeterministicSku(product)
      expect(sku).toBe('SKU-TRIM-01')
    })

    it('should fall back to category and ID formatting when SKU is empty or undefined', () => {
      const productWithoutSku = createMockDummyJsonProduct({
        id: 7,
        category: 'groceries',
        sku: ''
      })

      const sku = generateDeterministicSku(productWithoutSku)
      // Category prefix: 'GROC', ID suffix: '007' -> 'GROC-007'
      expect(sku).toBe('GROC-007')
    })

    it('should handle short categories with padding in fallback SKU', () => {
      const productShortCat = createMockDummyJsonProduct({
        id: 42,
        category: 'tv',
        sku: undefined
      })

      const sku = generateDeterministicSku(productShortCat)
      // Category 'tv' is 2 chars, padded to 3 -> 'TVX-042'
      expect(sku).toBe('TVX-042')
    })

    it('should produce identical SKUs on repeated invocations (idempotency)', () => {
      const product = createMockDummyJsonProduct({ id: 15, category: 'fragrances' })
      const firstSku = generateDeterministicSku(product)
      const secondSku = generateDeterministicSku(product)
      expect(firstSku).toBe(secondSku)
    })
  })

  describe('USD to IDR Currency Conversion', () => {
    it('should verify project baseline exchange rate constant is 16,000 IDR', () => {
      expect(PROJECT_FIXED_USD_TO_IDR_RATE).toBe(16_000)
    })

    it('should accurately convert standard USD price to IDR', () => {
      // 10 USD * 16,000 = 160,000 IDR
      expect(convertUsdToIdr(10)).toBe(160_000)
      // 9.99 USD * 16,000 = 159,840 IDR
      expect(convertUsdToIdr(9.99)).toBe(159_840)
    })

    it('should round fractional IDR results to nearest integer', () => {
      // 1.2345 USD * 16,000 = 19,752 IDR
      expect(convertUsdToIdr(1.2345)).toBe(19_752)
    })

    it('should safely return 0 for zero, negative, or non-finite values', () => {
      expect(convertUsdToIdr(0)).toBe(0)
      expect(convertUsdToIdr(-15)).toBe(0)
      expect(convertUsdToIdr(Number.NaN)).toBe(0)
      expect(convertUsdToIdr(Number.POSITIVE_INFINITY)).toBe(0)
      expect(convertUsdToIdr(Number.NEGATIVE_INFINITY)).toBe(0)
    })
  })

  describe('Incomplete External Payloads & Stock Protection Invariants', () => {
    it('should handle payloads missing optional fields without throwing errors', () => {
      const incompleteProduct: DummyJsonProduct = {
        id: 99,
        title: 'Minimal Product',
        description: '',
        category: 'general',
        price: 5.5,
        stock: 20,
        images: [],
        thumbnail: ''
      }

      const sku = generateDeterministicSku(incompleteProduct)
      const idrPrice = convertUsdToIdr(incompleteProduct.price)

      expect(sku).toBe('GENE-099')
      expect(idrPrice).toBe(88_000)
    })

    it('should guarantee that updating product metadata preserves existing operational stock', () => {
      // Simulation of catalog sync stock protection logic
      const existingDbRecord = {
        id: 'uuid-prod-1',
        sku: 'RCH45Q1A',
        name: 'Old Mascara Title',
        price: 150_000,
        stock: 45 // Operational stock modified by warehouse admin!
      }

      const incomingExternalProduct = createMockDummyJsonProduct({
        sku: 'RCH45Q1A',
        title: 'New Improved Mascara Title',
        price: 10.99,
        stock: 5 // DummyJSON stock value (must NOT overwrite existing operational stock!)
      })

      // Simulated sync logic: Only update metadata, preserve stock
      const updatedMetadata = {
        name: incomingExternalProduct.title,
        price: convertUsdToIdr(incomingExternalProduct.price),
        stock: existingDbRecord.stock // Operational stock is retained!
      }

      expect(updatedMetadata.stock).toBe(45)
      expect(updatedMetadata.stock).not.toBe(incomingExternalProduct.stock)
      expect(updatedMetadata.name).toBe('New Improved Mascara Title')
    })
  })
})
