import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Banknote, Boxes, Package } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrencyIDR, formatNumber } from '@/lib/formatters'
import { LOW_STOCK_THRESHOLD } from '@/services/inventory-domain'

import type { Product } from '@/types/inventory'

interface ProductDetailHeaderProps {
  product: Product
  locale: string
  backLabel: string
}

export function ProductDetailHeader({ product, locale, backLabel }: ProductDetailHeaderProps) {
  const isLowStock = product.stock < LOW_STOCK_THRESHOLD

  return (
    <div className="space-y-4">
      {/* Back Link */}
      <div>
        <Link href={`/${locale}/reports/products`}>
          <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{backLabel}</span>
          </Button>
        </Link>
      </div>

      {/* Product Banner Card */}
      <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="border-border bg-muted/40 relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border shadow-xs">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill sizes="64px" className="object-cover" />
            ) : (
              <Package className="text-muted-foreground h-8 w-8" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-primary font-mono text-xs font-black">{product.sku}</span>
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                {product.category}
              </Badge>
              <Badge variant={isLowStock ? 'destructive' : 'default'} className="text-[10px]">
                {isLowStock ? 'Stok Menipis (< 5)' : 'Stok Aman'}
              </Badge>
            </div>
            <h1 className="text-foreground text-xl font-bold tracking-tight sm:text-2xl">{product.name}</h1>
            {product.description && <p className="text-muted-foreground line-clamp-1 text-xs">{product.description}</p>}
          </div>
        </div>

        {/* Quick Identity Badges */}
        <div className="flex flex-wrap items-center gap-3 border-t pt-3 sm:border-t-0 sm:pt-0">
          <div className="border-border bg-muted/30 rounded-lg border px-3 py-1.5 text-xs">
            <span className="text-muted-foreground block text-[10px] font-semibold uppercase">Stok Saat Ini</span>
            <div className="flex items-center gap-1">
              <Boxes className="text-accent h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-foreground font-mono font-bold">
                {formatNumber(product.stock, locale)} {product.unit}
              </span>
            </div>
          </div>

          <div className="border-border bg-muted/30 rounded-lg border px-3 py-1.5 text-xs">
            <span className="text-muted-foreground block text-[10px] font-semibold uppercase">Harga Satuan</span>
            <div className="flex items-center gap-1">
              <Banknote className="text-primary h-3.5 w-3.5" aria-hidden="true" />
              <span className="text-foreground font-mono font-bold">{formatCurrencyIDR(product.price, { locale })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
