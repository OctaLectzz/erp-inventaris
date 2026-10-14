'use client'

import { Filter, RotateCcw, Search } from 'lucide-react'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import { DataTable } from '@/components/shared/data-table/data-table'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getProductReportColumns } from '@/features/reports/product-report-columns'
import { LOW_STOCK_THRESHOLD } from '@/services/inventory-domain'

import type { Product } from '@/types/inventory'

interface ProductReportTableProps {
  products: Product[]
  categories: string[]
  locale: string
}

export function ProductReportTable({ products, categories, locale }: ProductReportTableProps) {
  const t = useTranslations('dashboard')
  const [search, setSearch] = React.useState('')
  const [category, setCategory] = React.useState('all')
  const [stockStatus, setStockStatus] = React.useState<'all' | 'low' | 'normal'>('all')

  const columns = React.useMemo(() => getProductReportColumns(locale), [locale])

  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      // 1. Search Query
      if (search.trim().length > 0) {
        const q = search.trim().toLowerCase()
        const matchesSku = p.sku.toLowerCase().includes(q)
        const matchesName = p.name.toLowerCase().includes(q)
        if (!matchesSku && !matchesName) return false
      }

      // 2. Category
      if (category !== 'all' && p.category !== category) {
        return false
      }

      // 3. Stock Status
      if (stockStatus === 'low' && p.stock >= LOW_STOCK_THRESHOLD) {
        return false
      }
      if (stockStatus === 'normal' && p.stock < LOW_STOCK_THRESHOLD) {
        return false
      }

      return true
    })
  }, [products, search, category, stockStatus])

  const handleReset = () => {
    setSearch('')
    setCategory('all')
    setStockStatus('all')
  }

  const hasFilters = Boolean(search || category !== 'all' || stockStatus !== 'all')

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <Card className="border-border">
        <CardHeader className="p-4 pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder="Cari berdasarkan SKU atau nama produk..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground shadow-xs focus:ring-1 focus:outline-hidden"
                  aria-label="Filter kategori"
                >
                  <option value="all">Semua Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Status Filter */}
              <select
                value={stockStatus}
                onChange={(e) => setStockStatus(e.target.value as 'all' | 'low' | 'normal')}
                className="h-9 rounded-md border border-input bg-background px-2.5 text-xs text-foreground shadow-xs focus:ring-1 focus:outline-hidden"
                aria-label="Filter status stok"
              >
                <option value="all">Semua Status Stok</option>
                <option value="low">Stok Menipis (&lt; 5)</option>
                <option value="normal">Stok Aman (≥ 5)</option>
              </select>

              {hasFilters && (
                <Button variant="ghost" size="xs" onClick={handleReset} className="h-9 gap-1 text-xs text-primary hover:underline">
                  <RotateCcw className="h-3 w-3" aria-hidden="true" />
                  <span>Reset</span>
                </Button>
              )}
            </div>
          </div>

          <div className="mt-2 border-t pt-2 text-xs text-muted-foreground">
            <span>
              Menampilkan {filteredProducts.length} dari {products.length} produk katalog
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* TanStack Data Table */}
      <DataTable columns={columns} data={filteredProducts} emptyMessage={t('reports.emptyProductMovements')} initialPageSize={10} />
    </div>
  )
}
