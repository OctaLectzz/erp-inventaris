'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Filter, Package, PackageX, Pencil, Plus, RotateCcw, Search, ShieldAlert } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ProductFormDialog } from '@/features/catalog/product-form-dialog'
import { LOW_STOCK_THRESHOLD } from '@/services/inventory-domain'

import type { Product } from '@/types/inventory'

interface CatalogTableProps {
  initialProducts: Product[]
  categories: string[]
  userRole: 'admin_gudang' | 'owner'
  locale: string
}

const ITEMS_PER_PAGE = 10

export function CatalogTable({ initialProducts, categories, userRole, locale }: CatalogTableProps) {
  const t = useTranslations('dashboard')

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [stockFilter, setStockFilter] = useState<'all' | 'low_stock' | 'normal'>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const isAdmin = userRole === 'admin_gudang'

  // Format currency in IDR
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  // Filtered and searched products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search matching SKU or Name
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.trim().toLowerCase()
        const matchesSku = p.sku.toLowerCase().includes(query)
        const matchesName = p.name.toLowerCase().includes(query)
        if (!matchesSku && !matchesName) return false
      }

      // Category matching
      if (selectedCategory !== 'all' && p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false
      }

      // Stock status filtering
      if (stockFilter === 'low_stock' && p.stock >= LOW_STOCK_THRESHOLD) {
        return false
      }
      if (stockFilter === 'normal' && p.stock < LOW_STOCK_THRESHOLD) {
        return false
      }

      return true
    })
  }, [products, searchQuery, selectedCategory, stockFilter])

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / ITEMS_PER_PAGE))
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredProducts.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [filteredProducts, currentPage])

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedCategory('all')
    setStockFilter('all')
    setCurrentPage(1)
  }

  const handleOpenAddDialog = () => {
    setEditingProduct(null)
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (product: Product) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleFormSuccess = (updatedOrNewProduct: Product) => {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.id === updatedOrNewProduct.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = updatedOrNewProduct
        return updated
      }
      return [updatedOrNewProduct, ...prev]
    })
  }

  return (
    <div className="space-y-4">
      {/* Read-Only Notice for Owner */}
      {!isAdmin && (
        <div className="border-primary/20 bg-secondary/50 text-foreground flex items-center justify-between rounded-lg border p-3.5 text-xs">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-primary h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{t('catalog.readOnlyNotice')}</span>
          </div>
          <Badge variant="outline" className="text-[11px]">
            Role: {userRole}
          </Badge>
        </div>
      )}

      {/* Control Bar: Search, Category, Stock Filters, Action Button */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" aria-hidden="true" />
              <Input
                placeholder={t('catalog.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 text-xs"
              />
            </div>

            {/* Filter Dropdowns and Action */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value)
                    setCurrentPage(1)
                  }}
                  className="border-input bg-background text-foreground h-9 rounded-md border px-2.5 text-xs shadow-xs focus:ring-1 focus:outline-hidden"
                  aria-label="Filter kategori"
                >
                  <option value="all">{t('catalog.allCategories')}</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stock Health Filter */}
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value as 'all' | 'low_stock' | 'normal')
                  setCurrentPage(1)
                }}
                className="border-input bg-background text-foreground h-9 rounded-md border px-2.5 text-xs shadow-xs focus:ring-1 focus:outline-hidden"
                aria-label="Filter status stok"
              >
                <option value="all">{t('catalog.allStatuses')}</option>
                <option value="low_stock">{t('catalog.statusLowStock')}</option>
                <option value="normal">{t('catalog.statusNormal')}</option>
              </select>

              {/* Add Product Button (admin_gudang only) */}
              {isAdmin && (
                <Button onClick={handleOpenAddDialog} size="sm" className="h-9 gap-1.5 text-xs font-semibold shadow-xs">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{t('catalog.addProduct')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Results Summary & Active Filters */}
          <div className="text-muted-foreground mt-3 flex items-center justify-between border-t pt-2.5 text-xs">
            <span>{t('catalog.showingResults', { count: paginatedProducts.length, total: filteredProducts.length })}</span>
            {(searchQuery || selectedCategory !== 'all' || stockFilter !== 'all') && (
              <Button variant="ghost" size="xs" onClick={handleResetFilters} className="text-primary h-6 gap-1 text-[11px] hover:underline">
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>{t('catalog.resetFilter')}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Catalog Table / Card Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-secondary text-muted-foreground mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <PackageX className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-foreground text-sm font-semibold">{t('catalog.emptySearch')}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-xs">
              Cobalah sesuaikan kata kunci pencarian atau ubah filter kategori dan status stok.
            </p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('catalog.resetFilter')}</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop & Tablet Table */}
          <div className="border-border bg-card hidden overflow-x-auto rounded-lg border shadow-xs md:block">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-border bg-muted/50 text-muted-foreground border-b font-semibold">
                  <th className="px-4 py-3">{t('catalog.columns.sku')}</th>
                  <th className="px-4 py-3">{t('catalog.columns.product')}</th>
                  <th className="px-4 py-3">{t('catalog.columns.category')}</th>
                  <th className="px-4 py-3">{t('catalog.columns.unit')}</th>
                  <th className="px-4 py-3 text-right">{t('catalog.columns.price')}</th>
                  <th className="px-4 py-3 text-right">{t('catalog.columns.stock')}</th>
                  <th className="px-4 py-3 text-center">{t('catalog.columns.status')}</th>
                  {isAdmin && <th className="px-4 py-3 text-right">{t('catalog.columns.actions')}</th>}
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {paginatedProducts.map((p) => {
                  const isLow = p.stock < LOW_STOCK_THRESHOLD
                  return (
                    <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                      {/* SKU */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-primary font-mono text-xs font-bold">{p.sku}</span>
                      </td>

                      {/* Product Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          {p.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="border-border h-8 w-8 shrink-0 rounded-md border object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="border-border bg-secondary text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md border">
                              <Package className="h-4 w-4" aria-hidden="true" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-foreground max-w-xs truncate font-semibold">{p.name}</p>
                            {p.description && <p className="text-muted-foreground max-w-xs truncate text-[11px]">{p.description}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="outline" className="text-[11px] tracking-wider uppercase">
                          {p.category}
                        </Badge>
                      </td>

                      {/* Unit */}
                      <td className="text-muted-foreground px-4 py-3 whitespace-nowrap">{p.unit}</td>

                      {/* Price */}
                      <td className="text-foreground px-4 py-3 text-right font-medium whitespace-nowrap">{formatCurrency(p.price)}</td>

                      {/* Stock Units */}
                      <td className="px-4 py-3 text-right font-mono text-sm font-bold whitespace-nowrap">
                        <span className={isLow ? 'text-destructive' : 'text-foreground'}>{p.stock}</span>
                      </td>

                      {/* Health Status */}
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        {isLow ? (
                          <Badge variant="destructive" className="gap-1 text-[11px]">
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                            <span>Stok Menipis ({p.stock})</span>
                          </Badge>
                        ) : (
                          <Badge variant="success" className="gap-1 text-[11px]">
                            <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                            <span>Stok Normal</span>
                          </Badge>
                        )}
                      </td>

                      {/* Actions (admin_gudang only) */}
                      {isAdmin && (
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="xs"
                            onClick={() => handleOpenEditDialog(p)}
                            className="gap-1 text-xs"
                            title={t('catalog.editProduct')}
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Edit</span>
                          </Button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Grid View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {paginatedProducts.map((p) => {
              const isLow = p.stock < LOW_STOCK_THRESHOLD
              return (
                <Card key={p.id} className="border-border shadow-xs">
                  <CardContent className="space-y-3 p-4 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {p.imageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img src={p.imageUrl} alt={p.name} className="border-border h-10 w-10 shrink-0 rounded-md border object-cover" />
                        ) : (
                          <div className="border-border bg-secondary text-muted-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-md border">
                            <Package className="h-5 w-5" aria-hidden="true" />
                          </div>
                        )}
                        <div>
                          <span className="text-primary font-mono text-xs font-bold">{p.sku}</span>
                          <h4 className="text-foreground line-clamp-1 font-semibold">{p.name}</h4>
                        </div>
                      </div>

                      {isLow ? (
                        <Badge variant="destructive" className="gap-1 text-[10px]">
                          <AlertTriangle className="h-2.5 w-2.5" aria-hidden="true" />
                          <span>{p.stock}</span>
                        </Badge>
                      ) : (
                        <Badge variant="success" className="gap-1 text-[10px]">
                          <CheckCircle2 className="h-2.5 w-2.5" aria-hidden="true" />
                          <span>{p.stock}</span>
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t pt-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">Kategori: </span>
                        <span className="text-foreground font-medium uppercase">{p.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">Harga: </span>
                        <span className="text-foreground font-bold">{formatCurrency(p.price)}</span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="flex justify-end border-t pt-2">
                        <Button variant="outline" size="xs" onClick={() => handleOpenEditDialog(p)} className="h-7 gap-1 text-xs">
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                          <span>Edit Produk</span>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t py-2 text-xs">
              <span className="text-muted-foreground">{t('catalog.pagination.page', { current: currentPage, total: totalPages })}</span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="h-8 px-2.5"
                >
                  {t('catalog.pagination.previous')}
                </Button>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="h-8 px-2.5"
                >
                  {t('catalog.pagination.next')}
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Embedded Add / Edit Modal Dialog */}
      <ProductFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={editingProduct}
        categories={categories}
        locale={locale}
        onSuccess={handleFormSuccess}
      />
    </div>
  )
}
