'use client'

import { AlertTriangle, CheckCircle2, Package, Pencil } from 'lucide-react'

import { DataTableColumnHeader } from '@/components/shared/data-table/data-table-column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LOW_STOCK_THRESHOLD } from '@/services/inventory-domain'

import type { Product } from '@/types/inventory'
import type { ColumnDef } from '@tanstack/react-table'

interface ColumnOptions {
  locale: string
  isAdmin: boolean
  onEditProduct: (product: Product) => void
}

export function getCatalogColumns({ locale, isAdmin, onEditProduct }: ColumnOptions): ColumnDef<Product>[] {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const columns: ColumnDef<Product>[] = [
    // SKU Column
    {
      accessorKey: 'sku',
      header: ({ column }) => <DataTableColumnHeader column={column} title="SKU" />,
      cell: ({ row }) => <span className="text-primary font-mono text-xs font-bold whitespace-nowrap">{row.getValue('sku')}</span>,
      enableSorting: true,
      enableHiding: false
    },

    // Product Name & Image
    {
      accessorKey: 'name',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Produk" />,
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex min-w-50 items-center gap-2.5">
            {product.imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={product.imageUrl}
                alt={product.name}
                className="border-border h-8 w-8 shrink-0 rounded-md border object-cover"
                loading="lazy"
              />
            ) : (
              <div className="border-border bg-secondary text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-md border">
                <Package className="h-4 w-4" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-foreground max-w-xs truncate font-semibold">{product.name}</p>
              {product.description && <p className="text-muted-foreground max-w-xs truncate text-[11px]">{product.description}</p>}
            </div>
          </div>
        )
      },
      enableSorting: true
    },

    // Category
    {
      accessorKey: 'category',
      header: ({ column }) => <DataTableColumnHeader column={column} title="Kategori" />,
      cell: ({ row }) => (
        <Badge variant="outline" className="text-[11px] tracking-wider whitespace-nowrap uppercase">
          {row.getValue('category')}
        </Badge>
      ),
      enableSorting: true
    },

    // Unit
    {
      accessorKey: 'unit',
      header: 'Satuan',
      cell: ({ row }) => <span className="text-muted-foreground text-xs whitespace-nowrap">{row.getValue('unit')}</span>
    },

    // Reference Price
    {
      accessorKey: 'price',
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader column={column} title="Harga" />
        </div>
      ),
      cell: ({ row }) => <div className="text-foreground text-right font-medium whitespace-nowrap">{formatCurrency(row.getValue('price'))}</div>,
      enableSorting: true
    },

    // Stock Quantity
    {
      accessorKey: 'stock',
      header: ({ column }) => (
        <div className="text-right">
          <DataTableColumnHeader column={column} title="Stok" />
        </div>
      ),
      cell: ({ row }) => {
        const stock = Number(row.getValue('stock'))
        const isLow = stock < LOW_STOCK_THRESHOLD
        return (
          <div className="text-right font-mono font-bold whitespace-nowrap">
            <span className={isLow ? 'text-destructive' : 'text-foreground'}>
              {stock} {row.original.unit}
            </span>
          </div>
        )
      },
      enableSorting: true
    },

    // Health Status
    {
      id: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const isLow = row.original.stock < LOW_STOCK_THRESHOLD
        return (
          <div className="text-center whitespace-nowrap">
            {isLow ? (
              <Badge variant="destructive" className="gap-1 px-2 py-0.5 text-[11px]">
                <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                <span>Stok Menipis ({row.original.stock})</span>
              </Badge>
            ) : (
              <Badge variant="success" className="gap-1 px-2 py-0.5 text-[11px]">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                <span>Stok Normal</span>
              </Badge>
            )}
          </div>
        )
      }
    }
  ]

  // Add Actions column if user has admin privileges
  if (isAdmin) {
    columns.push({
      id: 'actions',
      header: () => <div className="text-right">Aksi</div>,
      cell: ({ row }) => (
        <div className="text-right whitespace-nowrap">
          <Button variant="ghost" size="xs" onClick={() => onEditProduct(row.original)} className="gap-1 text-xs" title="Edit Produk">
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Edit</span>
          </Button>
        </div>
      )
    })
  }

  return columns
}
