'use client'

import { useMemo, useState } from 'react'
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { AlertTriangle, CheckCircle2, Filter, Package, PackageX, Pencil, Plus, RotateCcw, Search, ShieldAlert, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

import { DataTablePagination } from '@/components/shared/data-table/data-table-pagination'
import { DataTableViewOptions } from '@/components/shared/data-table/data-table-view-options'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getCatalogColumns } from '@/features/catalog/catalog-columns'
import { ProductDeleteDialog } from '@/features/catalog/product-delete-dialog'
import { ProductFormDialog } from '@/features/catalog/product-form-dialog'
import { LOW_STOCK_THRESHOLD } from '@/services/inventory-domain'

import type { UserRole } from '@/types/auth'
import type { Product } from '@/types/inventory'
import type { ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table'

interface CatalogTableProps {
  initialProducts: Product[]
  categories: string[]
  userRole: UserRole | string
  locale: string
}

export function CatalogTable({ initialProducts, categories, userRole, locale }: CatalogTableProps) {
  const t = useTranslations('dashboard')
  const isAdmin = userRole === 'admin_gudang' || userRole === 'administrator'

  // Data state
  const [products, setProducts] = useState<Product[]>(initialProducts)

  // TanStack Table states
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [stockHealthFilter, setStockHealthFilter] = useState<'all' | 'low_stock' | 'normal'>('all')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })

  // Modal dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)

  const handleOpenAddDialog = () => {
    setEditingProduct(null)
    setIsDialogOpen(true)
  }

  const handleOpenEditDialog = (product: Product) => {
    setEditingProduct(product)
    setIsDialogOpen(true)
  }

  const handleOpenDeleteDialog = (product: Product) => {
    setDeletingProduct(product)
  }

  const handleDeleteSuccess = (deletedProductId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedProductId))
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

  // Generate stable columns
  const columns = useMemo(
    () =>
      getCatalogColumns({
        locale,
        isAdmin,
        onEditProduct: handleOpenEditDialog,
        onDeleteProduct: handleOpenDeleteDialog,
        t: (key: string, values?: Record<string, unknown>) => t(`catalog.${key}`, values as never)
      }),
    [locale, isAdmin, t]
  )

  // Filter products by stock health condition prior to table passing
  const displayedProducts = useMemo(() => {
    if (stockHealthFilter === 'low_stock') {
      return products.filter((p) => p.stock < LOW_STOCK_THRESHOLD)
    }
    if (stockHealthFilter === 'normal') {
      return products.filter((p) => p.stock >= LOW_STOCK_THRESHOLD)
    }
    return products
  }, [products, stockHealthFilter])

  // Custom global filter function searching both SKU and Name
  const table = useReactTable({
    data: displayedProducts,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      pagination
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    globalFilterFn: (row, columnId, filterValue: string) => {
      if (!filterValue) return true
      const query = String(filterValue).toLowerCase().trim()
      const sku = String(row.original.sku || '').toLowerCase()
      const name = String(row.original.name || '').toLowerCase()
      return sku.includes(query) || name.includes(query)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const handleResetFilters = () => {
    setGlobalFilter('')
    setStockHealthFilter('all')
    table.getColumn('category')?.setFilterValue(undefined)
    setSorting([])
    table.setPageIndex(0)
  }

  const hasActiveFilters = Boolean(globalFilter) || stockHealthFilter !== 'all' || Boolean(table.getColumn('category')?.getFilterValue())

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount)
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

      {/* Control Bar: Search, Category, Stock Filters, Column Toggle, Action Button */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="text-muted-foreground absolute top-2.5 left-3 h-4 w-4" aria-hidden="true" />
              <Input
                placeholder={t('catalog.searchPlaceholder')}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Filter Dropdowns and Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Category Filter */}
              <div className="flex items-center gap-1.5">
                <Filter className="text-muted-foreground h-3.5 w-3.5" aria-hidden="true" />
                <select
                  value={(table.getColumn('category')?.getFilterValue() as string) ?? 'all'}
                  onChange={(e) => {
                    const val = e.target.value
                    table.getColumn('category')?.setFilterValue(val === 'all' ? undefined : val)
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
                value={stockHealthFilter}
                onChange={(e) => {
                  setStockHealthFilter(e.target.value as 'all' | 'low_stock' | 'normal')
                  table.setPageIndex(0)
                }}
                className="border-input bg-background text-foreground h-9 rounded-md border px-2.5 text-xs shadow-xs focus:ring-1 focus:outline-hidden"
                aria-label="Filter status stok"
              >
                <option value="all">{t('catalog.allStatuses')}</option>
                <option value="low_stock">{t('catalog.statusLowStock')}</option>
                <option value="normal">{t('catalog.statusNormal')}</option>
              </select>

              {/* Column Visibility Options */}
              <DataTableViewOptions
                table={table}
                triggerLabel={t('catalog.viewOptions')}
                titleLabel={t('catalog.toggleColumns')}
                columnLabels={{
                  sku: t('catalog.columns.sku'),
                  name: t('catalog.columns.product'),
                  category: t('catalog.columns.category'),
                  unit: t('catalog.columns.unit'),
                  price: t('catalog.columns.price'),
                  stock: t('catalog.columns.stock'),
                  status: t('catalog.columns.status'),
                  actions: t('catalog.columns.actions')
                }}
              />

              {/* Add Product Button (admin_gudang only) */}
              {isAdmin && (
                <Button onClick={handleOpenAddDialog} size="sm" className="h-9 gap-1.5 text-xs font-semibold shadow-xs">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{t('catalog.addProduct')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Results Summary & Reset Trigger */}
          <div className="text-muted-foreground border-border mt-3 flex items-center justify-between border-t pt-2.5 text-xs">
            <span>
              {t('catalog.showingResults', {
                count: table.getRowModel().rows.length,
                total: table.getFilteredRowModel().rows.length
              })}
            </span>
            {hasActiveFilters && (
              <Button variant="ghost" size="xs" onClick={handleResetFilters} className="text-primary h-6 gap-1 text-[11px] hover:underline">
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>{t('catalog.resetFilter')}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area: Empty State OR TanStack Table / Mobile Cards */}
      {table.getFilteredRowModel().rows.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-secondary text-muted-foreground mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <PackageX className="h-6 w-6" aria-hidden="true" />
            </div>
            <h3 className="text-foreground text-sm font-semibold">{t('catalog.emptySearch')}</h3>
            <p className="text-muted-foreground mt-1 max-w-sm text-xs">{t('catalog.emptySearchSubtitle')}</p>
            <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{t('catalog.resetFilter')}</span>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop & Tablet TanStack Table View */}
          <div className="border-border bg-card hidden overflow-hidden rounded-lg border shadow-xs md:block">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card Grid View (Driven dynamically by TanStack Table) */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {table.getRowModel().rows.map((row) => {
              const p = row.original
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

                    <div className="border-border grid grid-cols-2 gap-2 border-t pt-2 text-[11px]">
                      <div>
                        <span className="text-muted-foreground">{t('catalog.columns.category')}: </span>
                        <span className="text-foreground font-medium uppercase">{p.category}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-muted-foreground">{t('catalog.columns.price')}: </span>
                        <span className="text-foreground font-bold">{formatCurrency(p.price)}</span>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="border-border flex justify-end gap-1.5 border-t pt-2">
                        <Button variant="outline" size="xs" onClick={() => handleOpenEditDialog(p)} className="h-7 gap-1 text-xs">
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                          <span>{t('catalog.editProduct')}</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleOpenDeleteDialog(p)}
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive h-7 gap-1 text-xs"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                          <span>{locale === 'en' ? 'Delete' : 'Hapus'}</span>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Unified TanStack Table Pagination */}
          <DataTablePagination table={table} />
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

      {/* Embedded Delete Confirmation Dialog */}
      <ProductDeleteDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        product={deletingProduct}
        locale={locale}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  )
}
