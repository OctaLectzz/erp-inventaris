'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Package } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrencyIDR, formatNumber } from '@/lib/formatters'
import { LOW_STOCK_THRESHOLD } from '@/services/inventory-domain'

import type { Product } from '@/types/inventory'
import type { ColumnDef } from '@tanstack/react-table'

export function getProductReportColumns(locale: string): ColumnDef<Product>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Produk / SKU',
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center gap-3">
            <div className="border-border bg-muted/40 relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border">
              {product.imageUrl ? (
                <Image src={product.imageUrl} alt={product.name} fill sizes="40px" className="object-cover" />
              ) : (
                <Package className="text-muted-foreground h-5 w-5" aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/${locale}/reports/products/${product.id}`}
                className="text-foreground hover:text-primary block truncate text-xs font-semibold hover:underline"
              >
                {product.name}
              </Link>
              <span className="text-primary font-mono text-[11px] font-bold">{product.sku}</span>
            </div>
          </div>
        )
      }
    },
    {
      accessorKey: 'category',
      header: 'Kategori',
      cell: ({ row }) => {
        const category = row.getValue('category') as string
        return (
          <Badge variant="outline" className="font-mono text-[10px] uppercase">
            {category}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'stock',
      header: 'Stok Fisik',
      cell: ({ row }) => {
        const stock = row.getValue('stock') as number
        const isLow = stock < LOW_STOCK_THRESHOLD
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold">
              {formatNumber(stock, locale)} {row.original.unit}
            </span>
            <Badge variant={isLow ? 'destructive' : 'default'} className="text-[10px]">
              {isLow ? 'Stok Menipis' : 'Aman'}
            </Badge>
          </div>
        )
      }
    },
    {
      accessorKey: 'price',
      header: 'Harga Satuan',
      cell: ({ row }) => {
        const price = row.getValue('price') as number
        return <span className="text-muted-foreground font-mono text-xs">{formatCurrencyIDR(price, { locale })}</span>
      }
    },
    {
      id: 'actions',
      header: 'Detail Mutasi',
      cell: ({ row }) => {
        const product = row.original
        return (
          <Link href={`/${locale}/reports/products/${product.id}`}>
            <Button variant="ghost" size="xs" className="text-primary h-7 gap-1 text-xs font-semibold hover:underline">
              <span>Lihat Detail</span>
              <ArrowRight className="h-3 w-3" aria-hidden="true" />
            </Button>
          </Link>
        )
      }
    }
  ]
}
