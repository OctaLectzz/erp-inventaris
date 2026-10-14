'use client'

import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from '@tanstack/react-table'
import { Folder, FolderPlus, FolderX, Pencil, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import { DataTablePagination } from '@/components/shared/data-table/data-table-pagination'
import { DataTableViewOptions } from '@/components/shared/data-table/data-table-view-options'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getCategoryColumns } from '@/features/categories/category-columns'
import { CategoryFormDialog } from '@/features/categories/category-form-dialog'

import type { Category } from '@/types/inventory'
import type { ColumnFiltersState, PaginationState, SortingState, VisibilityState } from '@tanstack/react-table'

interface CategoryTableProps {
  initialCategories: Category[]
  userRole: string
  locale: string
}

export function CategoryTable({ initialCategories, userRole, locale }: CategoryTableProps) {
  const t = useTranslations('dashboard')
  const isAdmin = userRole === 'admin_gudang' || userRole === 'administrator'

  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [globalFilter, setGlobalFilter] = useState('')
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10
  })

  // Modal dialog states
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'delete'>('create')
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)

  const handleOpenCreate = () => {
    setActiveCategory(null)
    setDialogMode('create')
    setDialogOpen(true)
  }

  const handleOpenEdit = (category: Category) => {
    setActiveCategory(category)
    setDialogMode('edit')
    setDialogOpen(true)
  }

  const handleOpenDelete = (category: Category) => {
    setActiveCategory(category)
    setDialogMode('delete')
    setDialogOpen(true)
  }

  const handleSuccess = (updatedCategory?: Category) => {
    if (dialogMode === 'create' && updatedCategory) {
      setCategories((prev) => [...prev, updatedCategory].sort((a, b) => a.name.localeCompare(b.name)))
    } else if (dialogMode === 'edit' && updatedCategory) {
      setCategories((prev) => prev.map((c) => (c.id === updatedCategory.id ? updatedCategory : c)).sort((a, b) => a.name.localeCompare(b.name)))
    } else if (dialogMode === 'delete' && activeCategory) {
      setCategories((prev) => prev.filter((c) => c.id !== activeCategory.id))
    }
  }

  const columns = useMemo(
    () =>
      getCategoryColumns({
        locale,
        isAdmin,
        onEditCategory: handleOpenEdit,
        onDeleteCategory: handleOpenDelete,
        t: (key: string, values?: Record<string, unknown>) => t(key as Parameters<typeof t>[0], values as never)
      }),
    [locale, isAdmin, t]
  )

  const table = useReactTable({
    data: categories,
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
      const name = String(row.original.name || '').toLowerCase()
      const slug = String(row.original.slug || '').toLowerCase()
      return name.includes(query) || slug.includes(query)
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  })

  const handleResetFilters = () => {
    setGlobalFilter('')
    setSorting([{ id: 'name', desc: false }])
    table.setPageIndex(0)
  }

  const hasActiveFilters = Boolean(globalFilter)

  return (
    <div className="space-y-4">
      {/* Search and Action Bar */}
      <Card className="border-border shadow-xs">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <Input
                placeholder={t('categories.searchPlaceholder')}
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-2.5">
              {/* Column Visibility Options */}
              <DataTableViewOptions
                table={table}
                triggerLabel={t('catalog.viewOptions')}
                titleLabel={t('catalog.toggleColumns')}
                columnLabels={{
                  name: t('categories.columns.name'),
                  slug: t('categories.columns.slug'),
                  description: t('categories.columns.description'),
                  productCount: t('categories.columns.productCount'),
                  createdAt: t('categories.columns.createdAt'),
                  actions: t('categories.columns.actions')
                }}
              />

              {/* Add Category Button (Admin only) */}
              {isAdmin && (
                <Button onClick={handleOpenCreate} size="sm" className="h-9 gap-1.5 text-xs font-semibold shadow-xs">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{t('categories.addCategory')}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-xs text-muted-foreground">
            <span>
              {t('catalog.showingResults', {
                count: table.getRowModel().rows.length,
                total: table.getFilteredRowModel().rows.length
              })}
            </span>
            {hasActiveFilters && (
              <Button variant="ghost" size="xs" onClick={handleResetFilters} className="h-6 gap-1 text-[11px] text-primary hover:underline">
                <RotateCcw className="h-3 w-3" aria-hidden="true" />
                <span>{t('catalog.resetFilter')}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content Area */}
      {table.getFilteredRowModel().rows.length === 0 ? (
        <Card className="border-border">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              {categories.length === 0 ? <FolderPlus className="h-6 w-6" aria-hidden="true" /> : <FolderX className="h-6 w-6" aria-hidden="true" />}
            </div>
            <h3 className="text-sm font-semibold text-foreground">
              {categories.length === 0 ? t('categories.emptyState') : t('categories.emptySearch')}
            </h3>
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-4 gap-1.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{t('catalog.resetFilter')}</span>
              </Button>
            ) : (
              isAdmin && (
                <Button onClick={handleOpenCreate} size="sm" className="mt-4 gap-1.5 text-xs">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>{t('categories.addCategory')}</span>
                </Button>
              )
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop & Tablet Table */}
          <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-xs md:block">
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

          {/* Mobile Card Grid View */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {table.getRowModel().rows.map((row) => {
              const cat = row.original
              const hasProducts = cat.productCount > 0

              return (
                <Card key={cat.id} className="border-border shadow-xs">
                  <CardContent className="space-y-3 p-4 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-primary/10 text-primary">
                          <Folder className="h-4 w-4" aria-hidden="true" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{cat.name}</h4>
                          <span className="font-mono text-[11px] text-muted-foreground">{cat.slug}</span>
                        </div>
                      </div>

                      <Badge variant={hasProducts ? 'secondary' : 'outline'} className="text-[10px]">
                        {t('categories.productCount', { count: cat.productCount })}
                      </Badge>
                    </div>

                    {cat.description && <p className="border-t border-border pt-2 text-[11px] text-muted-foreground">{cat.description}</p>}

                    {isAdmin && (
                      <div className="flex items-center justify-end gap-2 border-t border-border pt-2">
                        <Button variant="outline" size="xs" onClick={() => handleOpenEdit(cat)} className="h-7 gap-1 text-xs">
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                          <span>{t('categories.editCategory')}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleOpenDelete(cat)}
                          disabled={hasProducts}
                          className="h-7 gap-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
                        >
                          <Trash2 className="h-3 w-3" aria-hidden="true" />
                          <span>{t('categories.deleteCategory')}</span>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          <DataTablePagination table={table} />
        </>
      )}

      {/* Embedded Category Form Dialog */}
      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={activeCategory}
        mode={dialogMode}
        locale={locale}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
