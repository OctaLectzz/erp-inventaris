import { ArrowLeft, Banknote, Boxes, Package } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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
          <Button variant="ghost" size="xs" className="h-7 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{backLabel}</span>
          </Button>
        </Link>
      </div>

      {/* Product Banner Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40 shadow-xs">
            {product.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name} fill sizes="64px" className="object-cover" />
            ) : (
              <Package className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
            )}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-black text-primary">{product.sku}</span>
              <Badge variant="outline" className="font-mono text-[10px] uppercase">
                {product.category}
              </Badge>
              <Badge variant={isLowStock ? 'destructive' : 'default'} className="text-[10px]">
                {isLowStock ? 'Stok Menipis (< 5)' : 'Stok Aman'}
              </Badge>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{product.name}</h1>
            {product.description && <p className="line-clamp-1 text-xs text-muted-foreground">{product.description}</p>}
          </div>
        </div>

        {/* Quick Identity Badges */}
        <div className="flex flex-wrap items-center gap-3 border-t pt-3 sm:border-t-0 sm:pt-0">
          <div className="rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs">
            <span className="block text-[10px] font-semibold text-muted-foreground uppercase">Stok Saat Ini</span>
            <div className="flex items-center gap-1">
              <Boxes className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
              <span className="font-mono font-bold text-foreground">
                {formatNumber(product.stock, locale)} {product.unit}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-muted/30 px-3 py-1.5 text-xs">
            <span className="block text-[10px] font-semibold text-muted-foreground uppercase">Harga Satuan</span>
            <div className="flex items-center gap-1">
              <Banknote className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="font-mono font-bold text-foreground">{formatCurrencyIDR(product.price, { locale })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
