'use client'

import { Folder, Pencil, Trash2 } from 'lucide-react'

import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import type { Category } from '@/types/inventory'
import type { ColumnDef } from '@tanstack/react-table'

interface CategoryColumnOptions {
  locale: string
  isAdmin: boolean
  onEditCategory: (category: Category) => void
  onDeleteCategory: (category: Category) => void
  t?: (key: string, values?: Record<string, unknown>) => string
}

export function getCategoryColumns({ locale, isAdmin, onEditCategory, onDeleteCategory, t }: CategoryColumnOptions): ColumnDef<Category>[] {
  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat(locale === 'id' ? 'id-ID' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short'
      }).format(new Date(dateStr))
    } catch {
      return dateStr
    }
  }

  const columns: ColumnDef<Category>[] = [
    // Category Name
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t ? t('categories.columns.name') : locale === 'en' ? 'Category Name' : 'Nama Kategori'} />
      ),
      cell: ({ row }) => {
        const cat = row.original
        return (
          <div className="flex min-w-40 items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-primary/10 text-primary">
              <Folder className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <span className="font-semibold text-foreground">{cat.name}</span>
              <p className="font-mono text-[11px] text-muted-foreground">{cat.slug}</p>
            </div>
          </div>
        )
      },
      enableSorting: true,
      enableHiding: false
    },

    // Slug
    {
      accessorKey: 'slug',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t ? t('categories.columns.slug') : 'Slug'} />,
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono text-[11px]">
          {row.getValue('slug')}
        </Badge>
      ),
      enableSorting: true
    },

    // Description
    {
      accessorKey: 'description',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t ? t('categories.columns.description') : locale === 'en' ? 'Description' : 'Deskripsi'} />
      ),
      cell: ({ row }) => {
        const desc = row.getValue('description') as string | null
        return <span className="line-clamp-1 max-w-xs text-xs text-muted-foreground">{desc || '-'}</span>
      },
      enableSorting: false
    },

    // Associated Product Count
    {
      accessorKey: 'productCount',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t ? t('categories.columns.productCount') : locale === 'en' ? 'Product Count' : 'Jumlah Produk'}
        />
      ),
      cell: ({ row }) => {
        const count = row.getValue('productCount') as number
        return (
          <Badge variant={count > 0 ? 'secondary' : 'outline'} className="text-[11px] font-semibold">
            {t ? t('categories.productCount', { count }) : `${count} Produk`}
          </Badge>
        )
      },
      enableSorting: true
    },

    // Created At
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t ? t('categories.columns.createdAt') : locale === 'en' ? 'Created At' : 'Dibuat Pada'} />
      ),
      cell: ({ row }) => (
        <span className="font-mono text-[11px] whitespace-nowrap text-muted-foreground">{formatDate(row.getValue('createdAt'))}</span>
      ),
      enableSorting: true
    }
  ]

  // Authoritative RBAC Action Column (Admin only)
  if (isAdmin) {
    columns.push({
      id: 'actions',
      header: () => <span className="text-right text-xs font-semibold">{t ? t('categories.columns.actions') : 'Aksi'}</span>,
      cell: ({ row }) => {
        const cat = row.original
        const hasProducts = cat.productCount > 0

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => onEditCategory(cat)}
              className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
              title={t ? t('categories.editCategory') : 'Edit'}
              aria-label={`Edit ${cat.name}`}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>

            <Button
              variant="ghost"
              size="xs"
              onClick={() => onDeleteCategory(cat)}
              disabled={hasProducts}
              className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-30"
              title={hasProducts ? 'Tidak dapat dihapus karena masih memiliki produk' : t ? t('categories.deleteCategory') : 'Hapus'}
              aria-label={`Hapus ${cat.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>
        )
      },
      enableSorting: false,
      enableHiding: false
    })
  }

  return columns
}
