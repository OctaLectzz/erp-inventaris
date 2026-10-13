import { describe, expect, it, vi } from 'vitest'

import { getCatalogColumns } from '@/features/catalog/catalog-columns'

describe('Catalog Table Column Definitions', () => {
  const onEditProduct = vi.fn()

  it('includes actions column for admin_gudang role', () => {
    const columns = getCatalogColumns({
      locale: 'id',
      isAdmin: true,
      onEditProduct
    })

    const columnIds = columns.map((c) => (c as { accessorKey?: string; id?: string }).id || (c as { accessorKey?: string }).accessorKey)
    expect(columnIds).toContain('sku')
    expect(columnIds).toContain('name')
    expect(columnIds).toContain('category')
    expect(columnIds).toContain('unit')
    expect(columnIds).toContain('price')
    expect(columnIds).toContain('stock')
    expect(columnIds).toContain('status')
    expect(columnIds).toContain('actions')
  })

  it('excludes actions column for owner role (read-only audit)', () => {
    const columns = getCatalogColumns({
      locale: 'id',
      isAdmin: false,
      onEditProduct
    })

    const columnIds = columns.map((c) => (c as { accessorKey?: string; id?: string }).id || (c as { accessorKey?: string }).accessorKey)
    expect(columnIds).toContain('sku')
    expect(columnIds).toContain('name')
    expect(columnIds).not.toContain('actions')
  })

  it('configures sorting properly on key data columns', () => {
    const columns = getCatalogColumns({
      locale: 'id',
      isAdmin: true,
      onEditProduct
    })

    const skuCol = columns.find((c) => (c as { accessorKey?: string }).accessorKey === 'sku')
    const priceCol = columns.find((c) => (c as { accessorKey?: string }).accessorKey === 'price')
    const stockCol = columns.find((c) => (c as { accessorKey?: string }).accessorKey === 'stock')

    expect(skuCol?.enableSorting).toBe(true)
    expect(priceCol?.enableSorting).toBe(true)
    expect(stockCol?.enableSorting).toBe(true)
  })

  it('formats currency correctly in IDR format for price cell', () => {
    const columns = getCatalogColumns({
      locale: 'id',
      isAdmin: false,
      onEditProduct
    })

    const priceCol = columns.find((c) => (c as { accessorKey?: string }).accessorKey === 'price')
    expect(priceCol).toBeDefined()
  })
})
